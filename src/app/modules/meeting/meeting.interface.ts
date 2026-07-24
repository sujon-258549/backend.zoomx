export type MeetingStatus = "confirmed" | "cancelled" | "completed";

/**
 * A booked meeting. Times are stored as UTC instants; each side's local time is
 * derived on read from `hostTimezone` (admin) and `bookerTimezone` (visitor).
 */
export interface IMeeting {
  _id?: string;
  /** Booker details. */
  name: string;
  email: string;
  phone?: string;
  notes?: string;

  /** Meeting window as absolute UTC instants. */
  startTime: Date;
  endTime: Date;
  durationMinutes: number;

  /** IANA zone the visitor booked from (their country). */
  bookerTimezone: string;
  /** Snapshot of the host/admin zone at booking time. */
  hostTimezone: string;

  /** Snapshots taken at booking so later settings edits don't rewrite history. */
  meetingUrl?: string;
  adminEmail?: string;

  /** Answers to the host's custom booking questions (label + answer). */
  customAnswers?: { question: string; answer: string }[];

  /** Opaque token used for self-serve reschedule/cancel links (no login). */
  manageToken?: string;

  /** Host's private note about the meeting (what was discussed, prep, etc.). */
  adminNote?: string;
  /** Reason captured when the meeting is cancelled. */
  cancellationReason?: string;

  /** Reminder/follow-up bookkeeping so each email is sent at most once. */
  reminderSent?: boolean;
  followupSent?: boolean;

  status: MeetingStatus;
  is_deleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

/** One generated, still-open slot returned by the availability endpoint. */
export interface IAvailableSlot {
  /** UTC start instant (ISO string) — pass this back when booking. */
  start: string;
  /** UTC end instant (ISO). */
  end: string;
  /** Wall-clock label in the visitor's timezone. */
  visitorLabel: string;
  /** Wall-clock label in the host timezone. */
  hostLabel: string;
  /** False when the slot is already booked (shown as "Booked", not selectable). */
  available: boolean;
}
