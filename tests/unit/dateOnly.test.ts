import { describe, test, expect } from "vitest";
import {
  localDateKey,
  parseDateKey,
  toDateKey,
  formatDateKey,
} from "@/lib/dateOnly";

/**
 * These assertions are written to hold in every timezone, so the suite is run
 * under several (see the TZ sweep in the repo's test notes). The bug they guard
 * against - a round entered as Aug 7 listing as Aug 6 - only reproduced west of
 * UTC, so a test that is quietly UTC-only would not have caught it.
 */
describe("parseDateKey", () => {
  test("a date-input value becomes midnight UTC of that day", () => {
    expect(parseDateKey("2026-08-07").toISOString()).toBe("2026-08-07T00:00:00.000Z");
  });

  test("whitespace around the key is tolerated", () => {
    expect(parseDateKey(" 2026-08-07 ").toISOString()).toBe("2026-08-07T00:00:00.000Z");
  });

  test("an already-canonical value round-trips unchanged", () => {
    expect(parseDateKey("2026-08-07T00:00:00.000Z").toISOString()).toBe(
      "2026-08-07T00:00:00.000Z"
    );
  });

  test("a full timestamp is truncated to its UTC day", () => {
    expect(parseDateKey("2026-08-07T18:42:11.000Z").toISOString()).toBe(
      "2026-08-07T00:00:00.000Z"
    );
  });

  test("a Date is accepted, so server-side callers need no conversion", () => {
    const parsed = parseDateKey(new Date(Date.UTC(2026, 7, 7, 23, 59, 59)));
    expect(parsed.toISOString()).toBe("2026-08-07T00:00:00.000Z");
  });

  test("normalizing twice is the same as normalizing once", () => {
    const once = parseDateKey("2026-08-07");
    expect(parseDateKey(once).toISOString()).toBe(once.toISOString());
  });

  test("an unparseable value stays invalid for the caller to reject", () => {
    expect(Number.isNaN(parseDateKey("not a date").getTime())).toBe(true);
  });
});

describe("toDateKey", () => {
  test("reads a stored day back in UTC", () => {
    expect(toDateKey("2026-08-07T00:00:00.000Z")).toBe("2026-08-07");
  });

  test("round-trips with parseDateKey", () => {
    expect(toDateKey(parseDateKey("2026-01-05"))).toBe("2026-01-05");
  });

  test("pads single-digit months and days", () => {
    expect(toDateKey(parseDateKey("2026-01-05"))).toBe("2026-01-05");
  });
});

describe("formatDateKey", () => {
  /**
   * The regression guard. A stored day must render as the same calendar day a
   * locally-constructed date of that day renders as - which is what the user
   * typed. Comparing the two renderings keeps this independent of both the
   * runner's locale and its timezone.
   */
  test("a stored day renders as the day it was entered", () => {
    const enteredLocally = new Date(2026, 7, 7).toLocaleDateString();
    expect(formatDateKey("2026-08-07T00:00:00.000Z")).toBe(enteredLocally);
  });

  test("still correct across a month boundary", () => {
    const enteredLocally = new Date(2026, 0, 1).toLocaleDateString();
    expect(formatDateKey("2026-01-01T00:00:00.000Z")).toBe(enteredLocally);
  });

  test("format options are honoured", () => {
    const enteredLocally = new Date(2026, 7, 7).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    expect(
      formatDateKey("2026-08-07T00:00:00.000Z", { month: "short", day: "numeric" })
    ).toBe(enteredLocally);
  });

  test("a caller cannot accidentally override the storage timezone", () => {
    // `timeZone` is applied last on purpose - passing one must not reintroduce
    // the local-render bug this helper exists to prevent.
    const rendered = formatDateKey("2026-08-07T00:00:00.000Z", {
      timeZone: "Pacific/Kiritimati",
    } as Intl.DateTimeFormatOptions);
    expect(rendered).toBe(new Date(2026, 7, 7).toLocaleDateString());
  });
});

describe("localDateKey", () => {
  test("follows the viewer's day, not the UTC day", () => {
    // 11:30pm local on Aug 7. `toISOString().slice(0, 10)` - what the round form
    // used to do - yields Aug 8 here for anyone west of UTC, pre-filling
    // tomorrow's date.
    expect(localDateKey(new Date(2026, 7, 7, 23, 30))).toBe("2026-08-07");
  });

  test("follows the viewer's day just after local midnight too", () => {
    expect(localDateKey(new Date(2026, 7, 7, 0, 15))).toBe("2026-08-07");
  });

  test("pads single-digit months and days", () => {
    expect(localDateKey(new Date(2026, 0, 5, 12, 0))).toBe("2026-01-05");
  });

  test("defaults to now", () => {
    const now = new Date();
    expect(localDateKey()).toBe(localDateKey(now));
  });
});

describe("the entry-to-display round trip", () => {
  test("what the user picks is what the user sees", () => {
    // Exactly the reported bug, end to end: form value -> API normalization ->
    // serialized for the client -> rendered in the rounds table.
    const picked = "2026-08-07";
    const stored = parseDateKey(picked);
    const serialized = stored.toISOString();

    expect(formatDateKey(serialized)).toBe(new Date(2026, 7, 7).toLocaleDateString());
    expect(toDateKey(serialized)).toBe(picked);
  });
});
