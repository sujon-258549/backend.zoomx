import { randomUUID } from "crypto";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import {
  formatInZone,
  isValidTimeZone,
  parseHHmm,
  zonedDateKey,
  zonedWallTimeToUtc,
} from "../../utils/timezone";
import { IMeetingSetting } from "../meetingSetting/meetingSetting.interface";
import { getSettingsDoc } from "../meetingSetting/meetingSetting.service";
import {
  sendBookingEmails,
  sendCancellationEmails,
  sendRescheduleEmails,
  sendReminderEmail,
  sendFollowupEmail,
} from "./meeting.email";
import { IAvailableSlot, IMeeting, MeetingStatus } from "./meeting.interface";
import { Meeting } from "./meeting.model";

const DAY_MS = 24 * 60 * 60 * 1000;

type Busy = { start: number; end: number };

/** Parse a "YYYY-MM-DD" key into numeric parts. */
const parseDateKey = (key: string): { y: number; m: number; d: number } | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key).trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
};

/**
 * Generate every open slot for one civil date (Y-M-D interpreted in the host
 * timezone), honouring the weekly windows, slot length, buffer, min-notice,
 * max-advance and already-booked intervals.
 */
const generateSlotsForDate = (
  settings: IMeetingSetting,
  y: number,
  m: number,
  d: number,
  now: number,
  busy: Busy[]
): { start: Date; end: Date; available: boolean }[] => {
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const dayCfg = settings.availabilityDays?.find((x) => x.day === weekday);
  if (!dayCfg || !dayCfg.enabled || !dayCfg.windows?.length) return [];

  // Host-timezone civil date for this slate of slots.
  const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  // Holidays / manually blocked dates → no availability at all.
  if (settings.blockedDates?.includes(dateKey)) return [];
  // Daily booking cap → once the day is full, offer nothing more.
  const dailyLimit = settings.dailyLimit || 0;
  if (dailyLimit > 0) {
    const bookedToday = busy.filter(
      (b) => zonedDateKey(new Date(b.start), settings.timezone) === dateKey
    ).length;
    if (bookedToday >= dailyLimit) return [];
  }

  const duration = settings.slotDurationMinutes;
  const step = duration + (settings.bufferMinutes || 0);
  const earliest = now + (settings.minNoticeHours || 0) * 60 * 60 * 1000;
  const latest = now + (settings.maxAdvanceDays || 30) * DAY_MS;

  const slots: { start: Date; end: Date; available: boolean }[] = [];
  for (const w of dayCfg.windows) {
    const startMin = parseHHmm(w.start);
    const endMin = parseHHmm(w.end);
    if (startMin === null || endMin === null) continue;
    for (let t = startMin; t + duration <= endMin; t += step) {
      const hh = Math.floor(t / 60);
      const mm = t % 60;
      const startDate = zonedWallTimeToUtc(y, m, d, hh, mm, settings.timezone);
      const startMs = startDate.getTime();
      const endMs = startMs + duration * 60 * 1000;
      if (startMs < earliest) continue; // too soon / in the past — hidden entirely
      if (startMs > latest) continue; // beyond booking horizon — hidden entirely
      // Slots that clash with a booking are still returned, but flagged as taken
      // so the UI can show them as "Booked" instead of hiding them.
      const clashes = busy.some((b) => startMs < b.end && endMs > b.start);
      slots.push({ start: startDate, end: new Date(endMs), available: !clashes });
    }
  }
  return slots;
};

/** Fetch confirmed, non-deleted meetings overlapping a UTC range as busy intervals. */
const fetchBusy = async (fromMs: number, toMs: number): Promise<Busy[]> => {
  const docs = await Meeting.find({
    status: "confirmed",
    is_deleted: false,
    startTime: { $lt: new Date(toMs) },
    endTime: { $gt: new Date(fromMs) },
  })
    .select("startTime endTime")
    .lean();
  return docs.map((x) => ({
    start: new Date(x.startTime).getTime(),
    end: new Date(x.endTime).getTime(),
  }));
};

/** Public — open slots grouped by the visitor's local date, for a date range. */
const getAvailableSlots = async (
  fromKey: string,
  toKey: string,
  visitorTz: string
): Promise<{ timezone: string; hostTimezone: string; days: { date: string; slots: IAvailableSlot[] }[] }> => {
  const settings = await getSettingsDoc();
  if (!settings.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Meeting booking is currently disabled.");
  }
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey || fromKey);
  if (!from || !to) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid date range (use YYYY-MM-DD).");
  }
  const tz = isValidTimeZone(visitorTz) ? visitorTz : settings.timezone;

  const now = Date.now();
  // Pad one day either side so slots landing on a neighbouring visitor-date are
  // still captured, then filter back to the requested range.
  const startAnchor = Date.UTC(from.y, from.m - 1, from.d) - DAY_MS;
  const endAnchor = Date.UTC(to.y, to.m - 1, to.d) + DAY_MS;
  if (endAnchor - startAnchor > 62 * DAY_MS) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Date range too wide (max ~60 days).");
  }

  const busy = await fetchBusy(startAnchor - DAY_MS, endAnchor + DAY_MS);

  const grouped = new Map<string, IAvailableSlot[]>();
  for (let anchor = startAnchor; anchor <= endAnchor; anchor += DAY_MS) {
    const cd = new Date(anchor);
    const raw = generateSlotsForDate(
      settings,
      cd.getUTCFullYear(),
      cd.getUTCMonth() + 1,
      cd.getUTCDate(),
      now,
      busy
    );
    for (const s of raw) {
      const visitorDate = zonedDateKey(s.start, tz);
      if (visitorDate < fromKey || visitorDate > (toKey || fromKey)) continue;
      const slot: IAvailableSlot = {
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        visitorLabel: formatInZone(s.start, tz),
        hostLabel: formatInZone(s.start, settings.timezone),
        available: s.available,
      };
      if (!grouped.has(visitorDate)) grouped.set(visitorDate, []);
      grouped.get(visitorDate)!.push(slot);
    }
  }

  const days = Array.from(grouped.entries())
    .map(([date, slots]) => ({
      date,
      slots: slots
        .filter((s, i, arr) => arr.findIndex((o) => o.start === s.start) === i)
        .sort((a, b) => a.start.localeCompare(b.start)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { timezone: tz, hostTimezone: settings.timezone, days };
};

interface BookInput {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  start: string; // UTC ISO
  timezone: string; // visitor tz
  customAnswers?: { question: string; answer: string }[];
}

const bookMeeting = async (input: BookInput): Promise<IMeeting> => {
  const settings = await getSettingsDoc();
  if (!settings.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Meeting booking is currently disabled.");
  }
  if (!isValidTimeZone(input.timezone)) {
    throw new AppError(StatusCodes.BAD_REQUEST, `Unknown timezone: ${input.timezone}`);
  }
  const startDate = new Date(input.start);
  if (Number.isNaN(startDate.getTime())) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid slot start time.");
  }

  // Re-derive the slots for that host date and confirm the requested instant is
  // genuinely open right now (guards against stale/forged slots + double books).
  const key = zonedDateKey(startDate, settings.timezone);
  const kd = parseDateKey(key)!;
  const busy = await fetchBusy(startDate.getTime() - DAY_MS, startDate.getTime() + DAY_MS);
  const valid = generateSlotsForDate(settings, kd.y, kd.m, kd.d, Date.now(), busy).some(
    (s) => s.start.getTime() === startDate.getTime() && s.available
  );
  if (!valid) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "That time is no longer available. Please pick another slot."
    );
  }

  const endDate = new Date(startDate.getTime() + settings.slotDurationMinutes * 60 * 1000);

  try {
    const created = await Meeting.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
      customAnswers: input.customAnswers ?? [],
      startTime: startDate,
      endTime: endDate,
      durationMinutes: settings.slotDurationMinutes,
      bookerTimezone: input.timezone,
      hostTimezone: settings.timezone,
      meetingUrl: settings.meetingUrl,
      adminEmail: settings.adminEmail,
      manageToken: randomUUID(),
      status: "confirmed",
    });
    const meeting = created.toObject();

    // Fire-and-forget confirmation + host-notification emails (never blocks or
    // fails the booking — sendBookingEmails swallows its own errors).
    void sendBookingEmails(meeting, settings.title || "Meeting with ZOOMX");

    return meeting;
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "That time was just booked by someone else. Please pick another slot."
      );
    }
    throw err;
  }
};

const searchableFields = ["name", "email", "phone"];

const getAllMeetings = async (params: Record<string, unknown>, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, status, from, to } = params as Record<string, string>;

  const where: Record<string, unknown> = { is_deleted: { $ne: true } };
  if (status) where.status = status;
  if (keyword) {
    where.$or = searchableFields.map((f) => ({ [f]: { $regex: keyword, $options: "i" } }));
  }
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);
    where.startTime = range;
  }

  const sort =
    sortBy && sortBy !== "createdAt"
      ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
      : { startTime: -1 as const };

  const [data, total] = await Promise.all([
    Meeting.find(where).sort(sort as Record<string, 1 | -1>).skip(skip).limit(limit).lean(),
    Meeting.countDocuments(where),
  ]);
  return { meta: { page, limit, total }, data };
};

const getMeeting = async (id: string): Promise<IMeeting> => {
  const doc = await Meeting.findOne({ _id: id, is_deleted: false }).lean<IMeeting>();
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Meeting not found.");
  return doc;
};

const updateStatus = async (id: string, status: MeetingStatus): Promise<IMeeting> => {
  const doc = await Meeting.findOne({ _id: id, is_deleted: false });
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Meeting not found.");

  const prev = doc.status;
  // Marking "completed" manually triggers the follow-up (and blocks the auto one).
  const shouldFollowup = status === "completed" && prev !== "completed" && !doc.followupSent;
  doc.status = status;
  if (shouldFollowup) doc.followupSent = true;
  await doc.save();
  const obj = doc.toObject();

  if (status === "cancelled" && prev !== "cancelled") {
    void sendCancellationEmails(obj); // notify booker + host, free the slot
  }
  if (shouldFollowup) {
    const settings = await getSettingsDoc();
    void sendFollowupEmail(obj, settings.followupMessage || "Thank you for meeting with us!");
  }
  return obj;
};

const deleteMeeting = async (id: string): Promise<IMeeting> => {
  const doc = await Meeting.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { is_deleted: true },
    { new: true }
  ).lean<IMeeting>();
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Meeting not found or already deleted.");
  return doc;
};

// ── Self-serve manage (reschedule / cancel) via opaque token — no login ──

/** Public — fetch a booking for its manage page. */
const getByToken = async (token: string): Promise<IMeeting> => {
  const doc = await Meeting.findOne({ manageToken: token, is_deleted: false }).lean<IMeeting>();
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Booking not found.");
  return doc;
};

/** Public — cancel a booking; frees the slot and notifies both parties. */
const cancelByToken = async (token: string): Promise<IMeeting> => {
  const doc = await Meeting.findOne({ manageToken: token, is_deleted: false });
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Booking not found.");
  if (doc.status !== "cancelled") {
    doc.status = "cancelled";
    await doc.save();
    void sendCancellationEmails(doc.toObject());
  }
  return doc.toObject();
};

/** Public — move a booking to a new open slot; re-validates availability. */
const rescheduleByToken = async (
  token: string,
  newStart: string,
  timezone: string
): Promise<IMeeting> => {
  const settings = await getSettingsDoc();
  const doc = await Meeting.findOne({ manageToken: token, is_deleted: false });
  if (!doc) throw new AppError(StatusCodes.NOT_FOUND, "Booking not found.");
  if (doc.status === "cancelled") {
    throw new AppError(StatusCodes.BAD_REQUEST, "This booking was cancelled — please book a new time.");
  }
  const startDate = new Date(newStart);
  if (Number.isNaN(startDate.getTime())) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid slot start time.");
  }

  const key = zonedDateKey(startDate, settings.timezone);
  const kd = parseDateKey(key)!;
  const busy = await fetchBusy(startDate.getTime() - DAY_MS, startDate.getTime() + DAY_MS);
  const valid = generateSlotsForDate(settings, kd.y, kd.m, kd.d, Date.now(), busy).some(
    (s) => s.start.getTime() === startDate.getTime() && s.available
  );
  if (!valid) {
    throw new AppError(StatusCodes.CONFLICT, "That time is not available. Please pick another slot.");
  }

  doc.startTime = startDate;
  doc.endTime = new Date(startDate.getTime() + settings.slotDurationMinutes * 60 * 1000);
  doc.durationMinutes = settings.slotDurationMinutes;
  if (isValidTimeZone(timezone)) doc.bookerTimezone = timezone;
  doc.reminderSent = false;
  doc.followupSent = false;
  try {
    await doc.save();
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      throw new AppError(StatusCodes.CONFLICT, "That time was just taken. Please pick another.");
    }
    throw err;
  }
  const obj = doc.toObject();
  void sendRescheduleEmails(obj, settings.title || "Meeting with ZOOMX");
  return obj;
};

/** Human "in X" label from minutes (e.g. 90 → "1 hour 30 minutes"). */
const humanizeMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
  if (m || !h) parts.push(`${m} minute${m !== 1 ? "s" : ""}`);
  return parts.join(" ");
};

/**
 * Scheduler entry — sends the (admin-configured) reminder before each meeting
 * and, if enabled, a follow-up after it. Each email goes out at most once.
 */
const sendDueReminders = async (): Promise<void> => {
  const settings = await getSettingsDoc();
  const now = Date.now();
  const MIN = 60 * 1000;

  // ── Reminder: fire once the meeting is within `reminderMinutesBefore` of start ──
  const before = settings.reminderMinutesBefore ?? 60;
  if (before > 0) {
    const dueReminders = await Meeting.find({
      status: "confirmed",
      is_deleted: false,
      reminderSent: { $ne: true },
      startTime: { $gt: new Date(now), $lte: new Date(now + before * MIN) },
    });
    for (const m of dueReminders) {
      await sendReminderEmail(m.toObject(), humanizeMinutes(before));
      m.reminderSent = true;
      await m.save();
    }
  }

  // ── Follow-up: fire once `followupMinutesAfter` has passed since the end ──
  if (settings.followupEnabled) {
    const after = settings.followupMinutesAfter ?? 60;
    // Lower bound (24h) so a first run never emails a huge backlog of old meetings.
    const dueFollowups = await Meeting.find({
      status: "confirmed",
      is_deleted: false,
      followupSent: { $ne: true },
      endTime: {
        $gt: new Date(now - after * MIN - 24 * 60 * MIN),
        $lte: new Date(now - after * MIN),
      },
    });
    for (const m of dueFollowups) {
      await sendFollowupEmail(m.toObject(), settings.followupMessage || "Thank you for your time!");
      m.followupSent = true;
      await m.save();
    }
  }
};

export const MeetingServices = {
  getAvailableSlots,
  bookMeeting,
  getAllMeetings,
  getMeeting,
  updateStatus,
  deleteMeeting,
  getByToken,
  cancelByToken,
  rescheduleByToken,
  sendDueReminders,
};
