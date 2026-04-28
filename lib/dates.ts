/**
 * Timezone-aware date helpers. The app stores dates as ISO strings (YYYY-MM-DD)
 * in the user's local time, so a habit logged "today" stays attached to the
 * same calendar day regardless of where the user travels.
 */

const DEFAULT_TZ = "UTC";

/** "YYYY-MM-DD" for today in the given IANA timezone (e.g. "Africa/Lagos"). */
export function todayInTimezone(tz: string | null | undefined): string {
  // en-CA happens to format as YYYY-MM-DD with the standard date parts.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz ?? DEFAULT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 0..23 — the current hour in the given timezone. */
export function hourInTimezone(tz: string | null | undefined): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz ?? DEFAULT_TZ,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const raw = parts.find((p) => p.type === "hour")?.value ?? "0";
  const hour = parseInt(raw, 10);
  // Some locales emit "24" for midnight when hour12=false; normalise.
  return hour === 24 ? 0 : hour;
}

/** Parse "YYYY-MM-DD" into a Date at local midnight (suitable for `getDay()`). */
export function parseDateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** "Tuesday, 28 April 2026" — readable date for headers. */
export function formatLongDate(iso: string, tz?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz ?? DEFAULT_TZ,
  }).format(parseDateLocal(iso));
}

/** Format a Date back to "YYYY-MM-DD" using its LOCAL components. */
export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Return a new Date offset from `date` by `n` days (negative = past). */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Return a new Date at the start of the week (Sunday) containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Start of the month containing `date`. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Difference in whole days between `a` and `b` (a − b). */
export function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / 86_400_000);
}
