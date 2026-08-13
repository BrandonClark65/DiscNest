/**
 * Calendar-day dates.
 *
 * A round's date is a *day* - "I played on August 7th" - not an instant. Mongo
 * has no date-only type, so a day is stored as **midnight UTC of that day** and
 * that convention is what these helpers exist to hold.
 *
 * The trap, and the reason this file exists: `new Date("2026-08-07")` is parsed
 * as midnight *UTC* per the ECMAScript spec, but `toLocaleDateString()` renders
 * in the *local* zone. West of UTC those disagree, so a round entered as Aug 7
 * displayed as Aug 6 for every user in the Americas.
 *
 * So: parse days with `parseDateKey`, render them with `formatDateKey`, and
 * default form fields with `localDateKey`. Do not "fix" these by localizing the
 * stored value - the stored value has no timezone to localize, and treating it
 * as one is exactly the bug.
 */

/** `YYYY-MM-DD`, the format a native `<input type="date">` reads and writes. */
const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The `YYYY-MM-DD` an instant falls on in the *viewer's* zone; today by default.
 *
 * Use this for real timestamps - "which day did this happen on, to me?" - and to
 * default a date input. Deliberately not `toISOString().slice(0, 10)`, which
 * yields the UTC day and so pre-fills tomorrow for anyone west of UTC in their
 * evening.
 */
export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A calendar day as midnight UTC.
 *
 * Accepts what each caller actually has: a `YYYY-MM-DD` string from the date
 * input, or a `Date`/ISO timestamp already in the canonical form, which is
 * truncated to its UTC day so the invariant holds however the value arrived.
 */
export function parseDateKey(value: string | number | Date): Date {
  if (typeof value === "string") {
    const match = DATE_KEY.exec(value.trim());
    if (match) {
      return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    }
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return parsed; // let the caller's validation report it

  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
  );
}

/** The `YYYY-MM-DD` key of a stored day. Reads it back in UTC, as stored. */
export function toDateKey(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Render a stored day for a human.
 *
 * `timeZone: "UTC"` is not a detail - it is what keeps the displayed day equal
 * to the day that was entered, since the stored value is midnight UTC.
 */
export function formatDateKey(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(undefined, { ...options, timeZone: "UTC" });
}
