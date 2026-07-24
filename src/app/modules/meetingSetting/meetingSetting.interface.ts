/** One availability window within a weekday, in the HOST timezone (24h "HH:mm"). */
export interface IAvailabilityWindow {
  start: string; // "09:00"
  end: string; // "17:00"
}

/** Availability for a single weekday (0 = Sunday … 6 = Saturday). */
export interface IAvailabilityDay {
  day: number; // 0-6
  enabled: boolean;
  windows: IAvailabilityWindow[];
}

/** An extra question the host asks on the booking form. */
export interface ICustomQuestion {
  label: string;
  required?: boolean;
}

/**
 * Singleton meeting/scheduling configuration — the "custom Calendly" settings.
 * Availability windows are authored in `timezone` (the host/admin zone); every
 * booking is stored as a UTC instant derived from these windows.
 */
export interface IMeetingSetting {
  _id?: string;
  /** Booking page title / description shown to visitors. */
  title?: string;
  description?: string;
  /** Host (admin) IANA timezone — the anchor for all availability windows. */
  timezone: string;
  /** Fixed notification email — does not change per booking. */
  adminEmail: string;
  /** Parent meeting link (Zoom/Meet/…), revealed to the booker on confirmation. */
  meetingUrl?: string;
  /** Length of each bookable slot, in minutes. */
  slotDurationMinutes: number;
  /** Gap enforced between consecutive slots, in minutes. */
  bufferMinutes: number;
  /** How many days ahead a visitor may book. */
  maxAdvanceDays: number;
  /** Minimum notice (hours) before a slot can be booked. */
  minNoticeHours: number;
  /** Weekly recurring availability (exactly 7 entries, one per weekday). */
  availabilityDays: IAvailabilityDay[];
  /** Master switch for the whole booking feature. */
  isActive: boolean;

  /** Specific dates to block entirely ("YYYY-MM-DD", host-timezone civil dates). */
  blockedDates?: string[];
  /** Max confirmed bookings allowed per civil day (0 = unlimited). */
  dailyLimit?: number;
  /** Extra questions shown on the booking form. */
  customQuestions?: ICustomQuestion[];

  /** Minutes before start to email a reminder (0 = disabled). */
  reminderMinutesBefore?: number;
  /** Send a follow-up email after the meeting ends. */
  followupEnabled?: boolean;
  /** Minutes after the meeting ends to send the follow-up. */
  followupMinutesAfter?: number;
  /** Follow-up email body (rich-text HTML). */
  followupMessage?: string;
  /** Cancellation email body (rich-text HTML). */
  cancelMessage?: string;
  /** "Meeting completed" email body (rich-text HTML). */
  completedMessage?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
