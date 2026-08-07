import { describe, test, expect } from "vitest";

import {
  fallbackPPT,
  udiscToPdga,
  roundRating,
  playerRating,
  applyCaps,
  exceptionalAdjustment,
  courseHandicap,
  computeHandicap,
  ratingHistory,
  type ScoredRound,
} from "@/lib/handicap/handicapUtils";
import {
  PPT_MIN,
  PPT_MAX,
  SCRATCH_RATING,
  SOFT_CAP_PTS,
  HARD_CAP_PTS,
} from "@/app/constants/handicapConfig";

/** Build a window of rounds, newest first, `days` apart. */
const makeRounds = (ratings: number[], estimated = false): ScoredRound[] =>
  ratings.map((rating, i) => ({
    rating,
    date: new Date(2026, 0, 100 - i),
    holes: 18,
    estimated,
  }));

describe("fallbackPPT", () => {
  test("returns the published PDGA anchors on an 18-hole layout", () => {
    expect(fallbackPPT(44, 18)).toBeCloseTo(13, 5);
    expect(fallbackPPT(50, 18)).toBeCloseTo(10, 5);
    expect(fallbackPPT(68, 18)).toBeCloseTo(6, 5);
  });

  test("interpolates linearly between anchors", () => {
    // Halfway between SSA 44 (13 ppt) and SSA 50 (10 ppt).
    expect(fallbackPPT(47, 18)).toBeCloseTo(11.5, 5);
    // Halfway between SSA 50 (10 ppt) and SSA 68 (6 ppt).
    expect(fallbackPPT(59, 18)).toBeCloseTo(8, 5);
  });

  test("flattens outside the anchor range rather than extrapolating", () => {
    expect(fallbackPPT(30, 18)).toBeCloseTo(13, 5);
    expect(fallbackPPT(90, 18)).toBeCloseTo(6, 5);
  });

  test("scales points per throw by hole count so the rating scale stays fixed", () => {
    // A 9-hole layout of equivalent difficulty: half the SSA, double the ppt.
    expect(fallbackPPT(25, 9)).toBeCloseTo(20, 5);
    // 27 holes at equivalent difficulty: two thirds the ppt.
    expect(fallbackPPT(75, 27)).toBeCloseTo(10 * (18 / 27), 5);
  });

  test("keeps the 18-hole-equivalent value inside the clamp", () => {
    const ppt18 = fallbackPPT(50, 18);
    expect(ppt18).toBeGreaterThanOrEqual(PPT_MIN);
    expect(ppt18).toBeLessThanOrEqual(PPT_MAX);
  });
});

describe("udiscToPdga", () => {
  // Anchor pairs players report on the UDisc forum. UDisc publishes no official
  // mapping, so the fit is deliberately loose - these guard against the
  // constants drifting badly, not against a precise value. The 173/830 pair is
  // a single self-report and is the weakest of the four.
  const TOLERANCE = 20;
  test.each([
    [173, 830],
    [200, 900],
    [250, 1000],
    [312, 1120],
  ])("UDisc %i lands within %i points of PDGA %i", (udisc, expected) => {
    expect(Math.abs(udiscToPdga(udisc) - expected)).toBeLessThanOrEqual(TOLERANCE);
  });

  test("is monotonic", () => {
    expect(udiscToPdga(150)).toBeLessThan(udiscToPdga(151));
  });
});

describe("roundRating", () => {
  test("passes a PDGA rating through untouched and marks it exact", () => {
    const result = roundRating({ source: "pdga", providedRating: 942, holes: 18 });
    expect(result.rating).toBe(942);
    expect(result.estimated).toBe(false);
  });

  test("converts a UDisc rating and flags it estimated", () => {
    const result = roundRating({ source: "udisc", providedRating: 200, holes: 18 });
    expect(result.rating).toBe(900);
    expect(result.estimated).toBe(true);
  });

  test("rates a score against SSA using the PDGA formula", () => {
    // SSA 50 -> 10 ppt. Shooting 50 is scratch; 60 is ten throws worse.
    expect(roundRating({ source: "score_ssa", score: 50, ssa: 50, holes: 18 }).rating).toBe(1000);
    expect(roundRating({ source: "score_ssa", score: 60, ssa: 50, holes: 18 }).rating).toBe(900);
    expect(roundRating({ source: "score_ssa", score: 48, ssa: 50, holes: 18 }).rating).toBe(1020);
  });

  test("a 9-hole round produces the same rating as the equivalent 18-hole round", () => {
    const nine = roundRating({ source: "score_ssa", score: 27, ssa: 25, holes: 9 });
    const eighteen = roundRating({ source: "score_ssa", score: 54, ssa: 50, holes: 18 });
    expect(nine.rating).toBe(eighteen.rating);
  });

  test("rates against par but flags the result estimated", () => {
    const result = roundRating({ source: "score_par", score: 58, par: 54, holes: 18 });
    expect(result.estimated).toBe(true);
    expect(result.rating).toBeLessThan(SCRATCH_RATING);
  });

  test("throws when the source's required fields are missing", () => {
    expect(() => roundRating({ source: "pdga" })).toThrow();
    expect(() => roundRating({ source: "udisc" })).toThrow();
    expect(() => roundRating({ source: "score_ssa", score: 50 })).toThrow();
    expect(() => roundRating({ source: "score_par", score: 50 })).toThrow();
  });
});

describe("playerRating - WHS small-sample table", () => {
  test("returns null below the three-round minimum", () => {
    expect(playerRating(makeRounds([950, 950]))).toBeNull();
  });

  test.each([
    [3, 1, -20],
    [4, 1, -10],
    [5, 1, 0],
    [6, 2, -10],
    [7, 2, 0],
    [8, 2, 0],
    [9, 3, 0],
    [12, 4, 0],
    [15, 5, 0],
    [17, 6, 0],
    [19, 7, 0],
    [20, 8, 0],
  ])(
    "with %i rounds it averages the best %i and applies %i points",
    (count, expectedUse, expectedAdj) => {
      const result = playerRating(makeRounds(Array(count).fill(950)))!;
      expect(result.countedRounds).toBe(expectedUse);
      expect(result.sampleSize).toBe(count);
      // Every round is 950, so the average is 950 plus the table adjustment.
      expect(result.rating).toBe(950 + expectedAdj);
    }
  );

  test("the small-sample adjustment penalises, never flatters", () => {
    // Same quality of play, more rounds: the number must not go DOWN as the
    // record fills out. This is the sign trap - a reversed adjustment would
    // make a 3-round record score higher than a 5-round one.
    const three = playerRating(makeRounds(Array(3).fill(950)))!;
    const five = playerRating(makeRounds(Array(5).fill(950)))!;
    expect(three.rating).toBeLessThan(five.rating);
  });

  test("selects the best ratings, not the most recent", () => {
    // Newest first: a poor recent round must not drag the number down.
    const result = playerRating(makeRounds([800, 1000, 1000, 1000, 1000, 1000, 1000, 1000]))!;
    expect(result.rating).toBe(1000);
  });

  test("adding a bad round can never lower an established rating", () => {
    const before = playerRating(makeRounds(Array(8).fill(950)))!;
    const after = playerRating(makeRounds([600, ...Array(8).fill(950)]))!;
    expect(after.rating).toBeGreaterThanOrEqual(before.rating);
  });

  test("only the most recent 20 rounds are in scope", () => {
    // 20 mediocre recent rounds, then an old brilliant one that must fall out.
    const rounds = makeRounds([...Array(20).fill(900), 1200]);
    const result = playerRating(rounds)!;
    expect(result.sampleSize).toBe(20);
    expect(result.rating).toBe(900);
  });

  test("flags provisional below eight rounds and established at eight", () => {
    expect(playerRating(makeRounds(Array(7).fill(950)))!.provisional).toBe(true);
    expect(playerRating(makeRounds(Array(8).fill(950)))!.provisional).toBe(false);
  });

  test("countedIndices point back at the supplied rounds", () => {
    const result = playerRating(makeRounds([700, 1000, 700, 700, 700]))!;
    expect(result.countedIndices).toEqual([1]);
  });
});

describe("applyCaps - WHS 5.8", () => {
  test("does nothing without a 365-day high", () => {
    expect(applyCaps(900, null)).toBe(900);
  });

  test("does not restrict improvement", () => {
    expect(applyCaps(1000, 950)).toBe(1000);
  });

  test("leaves drops within the soft cap untouched", () => {
    expect(applyCaps(1000 - SOFT_CAP_PTS, 1000)).toBe(1000 - SOFT_CAP_PTS);
  });

  test("halves the excess beyond the soft cap", () => {
    // 40 points below the high: 30 free, then half of the remaining 10.
    expect(applyCaps(960, 1000)).toBe(965);
  });

  test("never falls further than the hard cap", () => {
    expect(applyCaps(500, 1000)).toBe(1000 - HARD_CAP_PTS);
  });
});

describe("exceptionalAdjustment - WHS 5.9", () => {
  test("returns nothing for an ordinary round", () => {
    expect(exceptionalAdjustment(960, 950)).toBe(0);
  });

  test("triggers the first tier exactly at 70 points", () => {
    expect(exceptionalAdjustment(1020, 950)).toBe(10);
    expect(exceptionalAdjustment(1019, 950)).toBe(0);
  });

  test("triggers the second tier exactly at 100 points", () => {
    expect(exceptionalAdjustment(1050, 950)).toBe(20);
    expect(exceptionalAdjustment(1049, 950)).toBe(10);
  });
});

describe("courseHandicap", () => {
  test("a scratch player receives no throws", () => {
    expect(courseHandicap(1000, { ppt: 10 }, 1000, 1).throws).toBe(0);
  });

  test("converts a rating deficit into throws at the layout's ppt", () => {
    // 50 points below scratch at 10 points per throw = 5 throws.
    expect(courseHandicap(950, { ppt: 10 }, 1000, 1).unrounded).toBeCloseTo(5, 5);
  });

  test("a harder layout with fewer points per throw yields more throws", () => {
    const easy = courseHandicap(900, { ppt: 13 }, 1000, 1).unrounded;
    const hard = courseHandicap(900, { ppt: 6 }, 1000, 1).unrounded;
    expect(hard).toBeGreaterThan(easy);
  });

  test("applies the allowance and rounds to the nearest half throw", () => {
    expect(courseHandicap(900, { ppt: 10 }, 1000, 0.95).throws).toBe(9.5);
  });

  test("honours a non-scratch league target", () => {
    expect(courseHandicap(850, { ppt: 10 }, 900, 1).unrounded).toBeCloseTo(5, 5);
  });
});

describe("ratingHistory", () => {
  const on = (day: number, rating: number): ScoredRound => ({
    rating,
    date: new Date(2026, 2, day),
    holes: 18,
  });

  test("returns nothing below the minimum round count", () => {
    expect(ratingHistory([on(1, 900), on(2, 900)])).toEqual([]);
  });

  test("starts producing points once the minimum is reached", () => {
    const points = ratingHistory([on(1, 900), on(2, 900), on(3, 900)]);
    expect(points).toHaveLength(1);
    expect(points[0].sampleSize).toBe(3);
  });

  test("uses the date the round was played, not the order it was entered", () => {
    // Entered newest-first, as the UI would after a backfill.
    const points = ratingHistory([on(5, 950), on(4, 940), on(3, 930), on(2, 920)]);
    const dates = points.map((p) => new Date(p.date).getDate());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
    expect(dates[dates.length - 1]).toBe(5);
  });

  test("each point reflects only the rounds played up to that date", () => {
    // A brilliant final round must not retroactively lift earlier points.
    const points = ratingHistory([on(1, 900), on(2, 900), on(3, 900), on(4, 1100)]);
    expect(points[0].rating).toBeLessThan(points[points.length - 1].rating);
  });

  test("collapses multiple rounds on one day into that day's final rating", () => {
    const sameDay: ScoredRound[] = [
      on(1, 900),
      on(2, 900),
      { rating: 900, date: new Date(2026, 2, 3), holes: 18 },
      { rating: 1000, date: new Date(2026, 2, 3), holes: 18 },
    ];
    const points = ratingHistory(sameDay);
    const days = points.map((p) => p.date.slice(0, 10));
    expect(new Set(days).size).toBe(days.length);
  });

  test("a backfill entered in one sitting still spans the real dates", () => {
    // The bug this replaced: twenty snapshots all stamped today.
    const season = Array.from({ length: 20 }, (_, i) => on(i + 1, 900 + i));
    const points = ratingHistory(season);
    const uniqueDays = new Set(points.map((p) => p.date.slice(0, 10)));
    expect(uniqueDays.size).toBeGreaterThan(1);
  });

  test("marks points provisional until the record is established", () => {
    const points = ratingHistory(Array.from({ length: 10 }, (_, i) => on(i + 1, 900)));
    expect(points[0].provisional).toBe(true);
    expect(points[points.length - 1].provisional).toBe(false);
  });
});

describe("computeHandicap", () => {
  test("returns nulls below the minimum round count", () => {
    const result = computeHandicap(makeRounds([950, 950]));
    expect(result.rating).toBeNull();
    expect(result.handicapThrows).toBeNull();
    expect(result.provisional).toBe(true);
  });

  test("produces a rating and a handicap once there are enough rounds", () => {
    const result = computeHandicap(makeRounds(Array(8).fill(900)), { ppt: 10 });
    expect(result.rating).toBe(900);
    expect(result.handicapThrows).toBe(9.5);
    expect(result.provisional).toBe(false);
  });

  test("applies the exceptional-score bump and reports it", () => {
    // Eight steady rounds, then one 100+ points better posted most recently.
    const rounds = makeRounds([1060, ...Array(8).fill(950)]);
    const result = computeHandicap(rounds, { ppt: 10 });
    expect(result.adjustments.some((a) => a.includes("Exceptional"))).toBe(true);
  });

  test("does not apply caps before the record is full", () => {
    const result = computeHandicap(makeRounds(Array(8).fill(700)), {
      ppt: 10,
      highRating365: 1000,
    });
    expect(result.adjustments.some((a) => a.includes("cap"))).toBe(false);
  });

  test("applies caps on a full record and reports it", () => {
    const result = computeHandicap(makeRounds(Array(20).fill(700)), {
      ppt: 10,
      highRating365: 1000,
    });
    expect(result.adjustments.some((a) => a.includes("cap"))).toBe(true);
    expect(result.rating).toBe(1000 - HARD_CAP_PTS);
  });

  test("flags estimated rounds only when they actually count", () => {
    // One estimated round, but it is the worst and does not make the best-2.
    const rounds: ScoredRound[] = [
      { rating: 600, date: new Date(2026, 0, 10), estimated: true },
      { rating: 950, date: new Date(2026, 0, 9) },
      { rating: 950, date: new Date(2026, 0, 8) },
      { rating: 950, date: new Date(2026, 0, 7) },
      { rating: 950, date: new Date(2026, 0, 6) },
      { rating: 950, date: new Date(2026, 0, 5) },
      { rating: 950, date: new Date(2026, 0, 4) },
      { rating: 950, date: new Date(2026, 0, 3) },
    ];
    expect(computeHandicap(rounds).hasEstimatedRounds).toBe(false);

    const estimatedCounts = computeHandicap(makeRounds(Array(8).fill(950), true));
    expect(estimatedCounts.hasEstimatedRounds).toBe(true);
  });

  test("carries the target rating through to the result", () => {
    const result = computeHandicap(makeRounds(Array(8).fill(900)), {
      ppt: 10,
      targetRating: 900,
    });
    expect(result.targetRating).toBe(900);
    expect(result.handicapThrows).toBe(0);
  });
});
