import { describe, test, expect } from "vitest";
import { handicapRoundSchema } from "@/lib/validation/handicapSchema";

/**
 * The round schema is the single normalization point for dates on the way in -
 * both `POST /api/handicap/rounds` and `PUT /api/handicap/rounds/[id]` parse
 * through it - so these assertions cover every write path without a database.
 */
const pdgaRound = (date: unknown) => ({
  source: "pdga" as const,
  date,
  holes: 18,
  providedRating: 950,
});

const parseDate = (date: unknown) => {
  const parsed = handicapRoundSchema.parse(pdgaRound(date));
  return parsed.date;
};

describe("handicapRoundSchema date normalization", () => {
  test("a date-input value is stored as midnight UTC of that day", () => {
    // The reported bug: `z.coerce.date()` accepted this and the round then read
    // back as Aug 6 for anyone west of UTC.
    expect(parseDate("2026-08-07").toISOString()).toBe("2026-08-07T00:00:00.000Z");
  });

  test("a JSON-serialized Date is truncated to its UTC day", () => {
    // What a client sends when it puts a real Date in the request body.
    expect(parseDate("2026-08-07T18:42:11.000Z").toISOString()).toBe(
      "2026-08-07T00:00:00.000Z"
    );
  });

  test("a Date instance is accepted for server-side callers", () => {
    expect(parseDate(new Date(Date.UTC(2026, 7, 7, 23, 59, 59))).toISOString()).toBe(
      "2026-08-07T00:00:00.000Z"
    );
  });

  test("re-parsing an already-stored round does not shift the day", () => {
    // Editing a round round-trips its date through the schema again; that must
    // be a no-op, or an edit would walk the date backwards one day at a time.
    const first = parseDate("2026-08-07");
    expect(parseDate(first).toISOString()).toBe(first.toISOString());
  });

  test("an unparseable date is rejected rather than stored as Invalid Date", () => {
    const result = handicapRoundSchema.safeParse(pdgaRound("not a date"));
    expect(result.success).toBe(false);
  });

  test("a missing date is still rejected", () => {
    const result = handicapRoundSchema.safeParse({
      source: "pdga",
      holes: 18,
      providedRating: 950,
    });
    expect(result.success).toBe(false);
  });

  test("normalization applies to every source, not just PDGA", () => {
    const scorePar = handicapRoundSchema.parse({
      source: "score_par",
      date: "2026-08-07",
      holes: 18,
      score: 58,
      par: 54,
    });
    expect(scorePar.date.toISOString()).toBe("2026-08-07T00:00:00.000Z");
  });

  test("the rest of the round still validates as before", () => {
    const parsed = handicapRoundSchema.parse({
      source: "udisc",
      date: "2026-08-07",
      holes: 9,
      providedRating: 60,
      courseName: "  Maple Hill  ",
    });

    expect(parsed.holes).toBe(9);
    expect(parsed.courseName).toBe("Maple Hill");
    expect(parsed.roundType).toBe("casual");
    expect(parsed.completed).toBe(true);
  });
});
