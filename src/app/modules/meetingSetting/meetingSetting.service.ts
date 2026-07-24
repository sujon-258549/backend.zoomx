import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { isValidTimeZone, parseHHmm } from "../../utils/timezone";
import {
  IAvailabilityDay,
  IAvailabilityWindow,
  IMeetingSetting,
} from "./meetingSetting.interface";
import { MeetingSetting } from "./meetingSetting.model";

/** Human-readable weekday names for error messages (0 = Sunday … 6 = Saturday). */
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const dayName = (day: number): string => WEEKDAY_NAMES[day] ?? `Day ${day}`;

/** Mon–Fri 09:00–17:00 enabled, weekend off — sane Calendly-style default. */
const defaultAvailability = (): IAvailabilityDay[] =>
  Array.from({ length: 7 }, (_, day) => ({
    day,
    enabled: day >= 1 && day <= 5,
    windows: day >= 1 && day <= 5 ? [{ start: "09:00", end: "17:00" }] : [],
  }));

/** Fields safe to expose on the public booking page (no admin email/URL). */
const PUBLIC_FIELDS = [
  "title",
  "description",
  "timezone",
  "slotDurationMinutes",
  "bufferMinutes",
  "maxAdvanceDays",
  "minNoticeHours",
  "availabilityDays",
  "isActive",
  "customQuestions",
] as const;

/** The config is a singleton — fetch it, seeding a default doc on first run. */
export const getSettingsDoc = async (): Promise<IMeetingSetting> => {
  let doc = await MeetingSetting.findOne().lean<IMeetingSetting>();
  if (!doc) {
    doc = (
      await MeetingSetting.create({ availabilityDays: defaultAvailability() })
    ).toObject();
  }
  return doc;
};

const getSettings = async (): Promise<IMeetingSetting> => getSettingsDoc();

const getPublicSettings = async (): Promise<Partial<IMeetingSetting>> => {
  const doc = await getSettingsDoc();
  const out: Record<string, unknown> = {};
  const src = doc as unknown as Record<string, unknown>;
  for (const f of PUBLIC_FIELDS) out[f] = src[f];
  return out as Partial<IMeetingSetting>;
};

/** Validate + normalise a single day's windows (order, bounds, no duplicates). */
const normaliseDay = (input: Partial<IAvailabilityDay>, day: number): IAvailabilityDay => {
  const windows: IAvailabilityWindow[] = [];
  const seen = new Set<string>();
  for (const w of input.windows ?? []) {
    const start = parseHHmm(w.start);
    const end = parseHHmm(w.end);
    if (start === null || end === null) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `${dayName(day)}: "${w.start}–${w.end}" is not a valid time. Use 24-hour HH:mm format (e.g. 09:00).`
      );
    }
    if (end <= start) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `${dayName(day)}: the end time (${w.end}) must be later than the start time (${w.start}).`
      );
    }
    const key = `${w.start}-${w.end}`;
    if (seen.has(key)) continue; // drop exact-duplicate windows
    seen.add(key);
    windows.push({ start: w.start, end: w.end });
  }
  // Reject overlapping windows within the same day.
  const sorted = [...windows].sort(
    (a, b) => (parseHHmm(a.start) as number) - (parseHHmm(b.start) as number)
  );
  for (let i = 1; i < sorted.length; i++) {
    if ((parseHHmm(sorted[i].start) as number) < (parseHHmm(sorted[i - 1].end) as number)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `${dayName(day)}: two time windows overlap (${sorted[i - 1].start}–${sorted[i - 1].end} and ${sorted[i].start}–${sorted[i].end}). Please keep them separate, without overlapping times.`
      );
    }
  }
  return { day, enabled: input.enabled ?? false, windows: sorted };
};

const updateSettings = async (
  data: Partial<IMeetingSetting>
): Promise<IMeetingSetting> => {
  const current = await getSettingsDoc();

  if (data.timezone && !isValidTimeZone(data.timezone)) {
    throw new AppError(StatusCodes.BAD_REQUEST, `Unknown timezone: ${data.timezone}`);
  }

  const patch: Partial<IMeetingSetting> = { ...data };

  if (data.availabilityDays) {
    // Build a full, ordered 7-day array so nothing is lost when a partial set
    // is sent. Any weekday not supplied keeps its current config.
    const byDay = new Map<number, Partial<IAvailabilityDay>>();
    for (const d of data.availabilityDays) byDay.set(d.day, d);
    patch.availabilityDays = Array.from({ length: 7 }, (_, day) => {
      const incoming = byDay.get(day);
      if (incoming) return normaliseDay(incoming, day);
      const existing = current.availabilityDays?.find((x) => x.day === day);
      return existing ?? { day, enabled: false, windows: [] };
    });
  }

  const updated = await MeetingSetting.findByIdAndUpdate(
    current._id,
    { $set: patch },
    { new: true }
  ).lean<IMeetingSetting>();

  if (!updated) {
    throw new AppError(StatusCodes.NOT_FOUND, "Meeting settings not found.");
  }
  return updated;
};

export const MeetingSettingServices = {
  getSettings,
  getPublicSettings,
  updateSettings,
};
