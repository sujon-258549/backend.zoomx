/**
 * Dependency-free IANA-timezone helpers built on `Intl.DateTimeFormat`.
 *
 * We never store wall-clock strings for meetings — everything is persisted as a
 * UTC `Date`. These helpers convert between a UTC instant and the wall-clock
 * time in any IANA zone (e.g. "Asia/Dhaka", "America/New_York"), handling DST
 * correctly because the offset is read from `Intl` for the specific instant.
 */

/** Weekday index (0 = Sunday … 6 = Saturday) for an instant in a given zone. */
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: number; // 0-6 (Sun-Sat)
}

/** Break a UTC instant into its wall-clock parts in `timeZone`. */
export const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  };
};

/**
 * Offset (ms) of `timeZone` at `date`, such that:
 *   localWallClockAsUTC = date.getTime() + offset
 */
const getZoneOffsetMs = (date: Date, timeZone: string): number => {
  const p = getZonedParts(date, timeZone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUTC - date.getTime();
};

/**
 * Convert a wall-clock time expressed in `timeZone` to the corresponding UTC
 * instant. DST-safe: we make an initial guess treating the wall time as UTC,
 * read the real offset at that instant, then correct (a second pass stabilises
 * the rare DST-boundary case).
 */
export const zonedWallTimeToUtc = (
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date => {
  const guessMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let offset = getZoneOffsetMs(new Date(guessMs), timeZone);
  let utcMs = guessMs - offset;
  // Re-read the offset at the corrected instant and adjust once more.
  const offset2 = getZoneOffsetMs(new Date(utcMs), timeZone);
  if (offset2 !== offset) {
    offset = offset2;
    utcMs = guessMs - offset;
  }
  return new Date(utcMs);
};

/** "YYYY-MM-DD" for an instant in a zone. */
export const zonedDateKey = (date: Date, timeZone: string): string => {
  const p = getZonedParts(date, timeZone);
  const mm = String(p.month).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${p.year}-${mm}-${dd}`;
};

/** "HH:mm" (24h) for an instant in a zone. */
export const zonedTimeKey = (date: Date, timeZone: string): string => {
  const p = getZonedParts(date, timeZone);
  const hh = String(p.hour).padStart(2, "0");
  const mm = String(p.minute).padStart(2, "0");
  return `${hh}:${mm}`;
};

/** Human display like "Mon, Jul 27, 2026, 09:30 AM" in the given zone. */
export const formatInZone = (date: Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

/** True when `tz` is a valid IANA timezone identifier. */
export const isValidTimeZone = (tz: string): boolean => {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/** Parse "HH:mm" → minutes since midnight, or null if malformed. */
export const parseHHmm = (value: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
};

/** minutes since midnight → "HH:mm". */
export const minutesToHHmm = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
