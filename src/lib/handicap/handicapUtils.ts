/**
 * DiscNest handicap engine.
 *
 * Deliberately free of Mongoose imports so the exact same math runs in the
 * browser for logged-out visitors and on the server for saved rounds.
 *
 * Two published systems are combined:
 *
 *  1. Round ratings use the PDGA formula
 *        rating = 1000 + (SSA - score) * pointsPerThrow
 *     where SSA is the score a 1000-rated player is expected to shoot on that
 *     layout. Points-per-throw is disc golf's inverse of golf's Slope Rating.
 *
 *  2. Player ratings use the USGA World Handicap System's "best 8 of the last
 *     20" selection rather than PDGA's weighted average. PDGA's average is
 *     tuned for a population that only posts tournament rounds, where
 *     sandbagging carries a reputational cost. With self-reported scores a
 *     weighted average is trivially inflated by posting bad rounds, whereas
 *     best-8-of-20 is structurally immune - a new bad round can only displace
 *     an older, worse one. UDisc independently made the same choice.
 */

import {
  PPT_ANCHORS,
  PPT_MIN,
  PPT_MAX,
  PTS_PER_THROW_STD,
  SCRATCH_RATING,
  UDISC_CONVERSION,
  WHS_SMALL_SAMPLE_TABLE,
  ROUND_WINDOW,
  MIN_ROUNDS_PROVISIONAL,
  MIN_ROUNDS_ESTABLISHED,
  SOFT_CAP_PTS,
  HARD_CAP_PTS,
  CAP_MIN_ROUNDS,
  EXCEPTIONAL_TIER_1_PTS,
  EXCEPTIONAL_TIER_2_PTS,
  EXCEPTIONAL_ADJ_1,
  EXCEPTIONAL_ADJ_2,
  DEFAULT_ALLOWANCE,
  RATING_FLOOR,
  RATING_CEILING,
  type RoundSource,
} from '@/app/constants/handicapConfig';
import { toDateKey } from '@/lib/dateOnly';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One round as the user entered it, before rating. */
export interface RoundInput {
  source: RoundSource;
  /** Holes actually played. Defaults to 18 when omitted. */
  holes?: number;
  /** Raw total throws. Required for score_ssa and score_par. */
  score?: number;
  /** Scratch scoring average for the layout. Required for score_ssa. */
  ssa?: number;
  /** Course par. Required for score_par. */
  par?: number;
  /** The rating the user pasted in. Required for pdga and udisc. */
  providedRating?: number;
}

export interface RatedRound {
  rating: number;
  /** True when the rating came through an unofficial conversion. */
  estimated: boolean;
  /** Points per throw used, already scaled to the round's hole count. */
  ppt: number;
}

/** A round that already has a rating, as stored. */
export interface ScoredRound {
  rating: number;
  date: Date | string;
  holes?: number;
  estimated?: boolean;
}

export interface PlayerRatingResult {
  rating: number;
  provisional: boolean;
  sampleSize: number;
  /** How many of the best rounds fed the average. */
  countedRounds: number;
  /** Indices into the supplied window, marking which rounds counted. */
  countedIndices: number[];
}

export interface HandicapResult {
  rating: number | null;
  provisional: boolean;
  sampleSize: number;
  countedRounds: number;
  countedIndices: number[];
  handicapThrows: number | null;
  handicapUnrounded: number | null;
  targetRating: number;
  /** True when any counted round used an unofficial conversion. */
  hasEstimatedRounds: boolean;
  /** Set when a cap or exceptional-score adjustment moved the raw number. */
  adjustments: string[];
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function toTime(date: Date | string): number {
  return date instanceof Date ? date.getTime() : new Date(date).getTime();
}

// ---------------------------------------------------------------------------
// Points per throw
// ---------------------------------------------------------------------------

/**
 * Interpolate PDGA's published points-per-throw anchors for an 18-hole layout.
 * Easy layouts compress scores, so each throw is worth more rating points.
 */
function interpolatePPT18(ssa18: number): number {
  const first = PPT_ANCHORS[0];
  const last = PPT_ANCHORS[PPT_ANCHORS.length - 1];
  if (ssa18 <= first.ssa18) return first.ppt;
  if (ssa18 >= last.ssa18) return last.ppt;

  for (let i = 0; i < PPT_ANCHORS.length - 1; i += 1) {
    const a = PPT_ANCHORS[i];
    const b = PPT_ANCHORS[i + 1];
    if (ssa18 <= b.ssa18) {
      const t = (ssa18 - a.ssa18) / (b.ssa18 - a.ssa18);
      return a.ppt + t * (b.ppt - a.ppt);
    }
  }
  return last.ppt;
}

/**
 * Points per throw for a round, already scaled to its hole count.
 *
 * Rating points are a fixed scale, so a throw on a 9-hole layout has to be
 * worth roughly double what it is on the equivalent 18-hole layout - otherwise
 * a 9-hole round would produce half the rating spread it should. We interpolate
 * on the 18-hole-equivalent SSA, clamp there, then scale back out.
 */
export function fallbackPPT(ssa: number, holes = 18): number {
  const safeHoles = holes > 0 ? holes : 18;
  const ssa18 = (ssa / safeHoles) * 18;
  const ppt18 = clamp(interpolatePPT18(ssa18), PPT_MIN, PPT_MAX);
  return ppt18 * (18 / safeHoles);
}

// ---------------------------------------------------------------------------
// Source conversions
// ---------------------------------------------------------------------------

/**
 * Convert a UDisc round rating (1-300+ scale) to the PDGA-style 1000 scale.
 *
 * UDisc explicitly declines to publish a mapping, so this is unofficial. The
 * linear fit matches the anchor pairs players report and is isolated in
 * handicapConfig so it can be retuned against real DiscNest data later.
 */
export function udiscToPdga(udiscRating: number): number {
  return UDISC_CONVERSION.slope * udiscRating + UDISC_CONVERSION.intercept;
}

/** Rate a single round, dispatching on where the number came from. */
export function roundRating(input: RoundInput): RatedRound {
  const holes = input.holes && input.holes > 0 ? input.holes : 18;

  switch (input.source) {
    case 'pdga': {
      if (input.providedRating == null || !Number.isFinite(input.providedRating)) {
        throw new Error('A PDGA round rating is required for source "pdga".');
      }
      return {
        rating: clamp(Math.round(input.providedRating), RATING_FLOOR, RATING_CEILING),
        estimated: false,
        ppt: fallbackPPT(holes * (50 / 18), holes),
      };
    }

    case 'udisc': {
      if (input.providedRating == null || !Number.isFinite(input.providedRating)) {
        throw new Error('A UDisc round rating is required for source "udisc".');
      }
      return {
        rating: clamp(
          Math.round(udiscToPdga(input.providedRating)),
          RATING_FLOOR,
          RATING_CEILING
        ),
        estimated: true,
        ppt: fallbackPPT(holes * (50 / 18), holes),
      };
    }

    case 'score_ssa': {
      if (input.score == null || input.ssa == null) {
        throw new Error('Both score and ssa are required for source "score_ssa".');
      }
      const ppt = fallbackPPT(input.ssa, holes);
      return {
        rating: clamp(
          Math.round(SCRATCH_RATING + (input.ssa - input.score) * ppt),
          RATING_FLOOR,
          RATING_CEILING
        ),
        estimated: false,
        ppt,
      };
    }

    case 'score_par': {
      if (input.score == null || input.par == null) {
        throw new Error('Both score and par are required for source "score_par".');
      }
      // Par is a weak stand-in for SSA - plenty of courses list a flat 54
      // regardless of difficulty - so this branch is surfaced as "rough".
      const ppt = fallbackPPT(input.par, holes);
      return {
        rating: clamp(
          Math.round(SCRATCH_RATING + (input.par - input.score) * ppt),
          RATING_FLOOR,
          RATING_CEILING
        ),
        estimated: true,
        ppt,
      };
    }

    default: {
      const exhaustive: never = input.source;
      throw new Error(`Unknown round source: ${String(exhaustive)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Player rating
// ---------------------------------------------------------------------------

/**
 * Best-N-of-20 with the USGA small-sample table (WHS 5.2a).
 *
 * The table's adjustment is expressed in strokes and is a penalty in golf,
 * where a lower index is better. On the 1000 scale higher is better, so it
 * SUBTRACTS. Reversing that sign is the classic bug here, and the unit tests
 * pin it down.
 *
 * Rounds are not weighted by hole count: the points-per-throw scaling in
 * fallbackPPT already normalizes a 9-hole round onto the same rating scale.
 */
export function playerRating(rounds: ScoredRound[]): PlayerRatingResult | null {
  const indexed = rounds.map((round, index) => ({ round, index }));
  indexed.sort((a, b) => toTime(b.round.date) - toTime(a.round.date));

  const window = indexed.slice(0, ROUND_WINDOW);
  const sampleSize = window.length;
  if (sampleSize < MIN_ROUNDS_PROVISIONAL) return null;

  const row =
    WHS_SMALL_SAMPLE_TABLE.find((r) => sampleSize >= r.min && sampleSize <= r.max) ??
    WHS_SMALL_SAMPLE_TABLE[WHS_SMALL_SAMPLE_TABLE.length - 1];

  const best = [...window]
    .sort((a, b) => b.round.rating - a.round.rating)
    .slice(0, row.use);

  const rating = mean(best.map((b) => b.round.rating)) + row.adjustment * PTS_PER_THROW_STD;

  return {
    rating: Math.round(rating),
    provisional: sampleSize < MIN_ROUNDS_ESTABLISHED,
    sampleSize,
    countedRounds: best.length,
    countedIndices: best.map((b) => b.index),
  };
}

// ---------------------------------------------------------------------------
// Anti-sandbagging
// ---------------------------------------------------------------------------

/**
 * WHS 5.8, on the 1000 scale. A rating falling more than SOFT_CAP_PTS below
 * its 365-day high only moves half as fast beyond that point, and can never
 * fall more than HARD_CAP_PTS below it. There is no limit on improvement.
 */
export function applyCaps(calculated: number, highRating365: number | null): number {
  if (highRating365 == null) return calculated;

  const drop = highRating365 - calculated;
  if (drop <= SOFT_CAP_PTS) return calculated;

  const softened = highRating365 - (SOFT_CAP_PTS + 0.5 * (drop - SOFT_CAP_PTS));
  return Math.round(Math.max(softened, highRating365 - HARD_CAP_PTS));
}

/**
 * WHS 5.9. A round played far above the player's standing rating bumps the
 * whole record, so banking bad rounds and then dumping one great one does not
 * pay. Returns the number of rating points to add (0 when not exceptional).
 */
export function exceptionalAdjustment(
  newRoundRating: number,
  ratingAtTimeOfPlay: number
): number {
  const delta = newRoundRating - ratingAtTimeOfPlay;
  if (delta >= EXCEPTIONAL_TIER_2_PTS) return EXCEPTIONAL_ADJ_2;
  if (delta >= EXCEPTIONAL_TIER_1_PTS) return EXCEPTIONAL_ADJ_1;
  return 0;
}

// ---------------------------------------------------------------------------
// Handicap in throws
// ---------------------------------------------------------------------------

/**
 * Throws a player receives on a layout.
 *
 * No extra hole-count factor here: `ppt` is already scaled to the layout's
 * hole count by fallbackPPT, so dividing by it yields throws over that many
 * holes directly. Applying holes/18 again would double-count.
 */
export function courseHandicap(
  rating: number,
  layout: { ppt: number; holes?: number },
  targetRating: number = SCRATCH_RATING,
  allowance: number = DEFAULT_ALLOWANCE
): { unrounded: number; throws: number } {
  const ppt = layout.ppt > 0 ? layout.ppt : PTS_PER_THROW_STD;
  const unrounded = (targetRating - rating) / ppt;
  return {
    unrounded,
    throws: Math.round(unrounded * allowance * 2) / 2, // nearest half throw
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/** One point on the rating-over-time curve. */
export interface RatingPoint {
  /** ISO date of the round that produced this rating. */
  date: string;
  rating: number;
  provisional: boolean;
  sampleSize: number;
}

/**
 * Rating history, computed as of each round's own date.
 *
 * Charting saved snapshots instead of this produces a useless picture when a
 * player backfills their history: twenty rounds entered in one sitting become
 * twenty points all stamped today. Recomputing per round date yields the actual
 * progression across the months they were played.
 *
 * Only rounds from MIN_ROUNDS_PROVISIONAL onward yield a point, since below
 * that we refuse to show a rating at all.
 */
export function ratingHistory(rounds: ScoredRound[]): RatingPoint[] {
  const chronological = [...rounds].sort((a, b) => toTime(a.date) - toTime(b.date));
  const points: RatingPoint[] = [];

  for (let i = 0; i < chronological.length; i += 1) {
    // Everything played up to and including this round.
    const soFar = chronological.slice(0, i + 1);
    const result = playerRating(soFar);
    if (!result) continue;

    const date = new Date(toTime(chronological[i].date)).toISOString();

    // Several rounds on one day collapse to that day's final rating, so a
    // tournament or a double-header does not spike the line. Both sides are read
    // in UTC, the zone round dates are stored in - see `@/lib/dateOnly`.
    const last = points[points.length - 1];
    if (last && toDateKey(last.date) === toDateKey(date)) {
      points[points.length - 1] = {
        date,
        rating: result.rating,
        provisional: result.provisional,
        sampleSize: result.sampleSize,
      };
      continue;
    }

    points.push({
      date,
      rating: result.rating,
      provisional: result.provisional,
      sampleSize: result.sampleSize,
    });
  }

  return points;
}

export interface ComputeOptions {
  targetRating?: number;
  allowance?: number;
  /** Points per throw of the layout the handicap is for. Defaults to standard. */
  ppt?: number;
  /** Highest rating over the trailing 365 days, for the WHS cap. */
  highRating365?: number | null;
}

/**
 * The single entry point used by both the API and the browser, so a logged-out
 * visitor and a logged-in member always see identical numbers.
 */
export function computeHandicap(
  rounds: ScoredRound[],
  options: ComputeOptions = {}
): HandicapResult {
  const targetRating = options.targetRating ?? SCRATCH_RATING;
  const allowance = options.allowance ?? DEFAULT_ALLOWANCE;
  const ppt = options.ppt ?? PTS_PER_THROW_STD;
  const adjustments: string[] = [];

  const base = playerRating(rounds);

  if (!base) {
    return {
      rating: null,
      provisional: true,
      sampleSize: rounds.length,
      countedRounds: 0,
      countedIndices: [],
      handicapThrows: null,
      handicapUnrounded: null,
      targetRating,
      hasEstimatedRounds: rounds.some((r) => r.estimated),
      adjustments,
    };
  }

  let rating = base.rating;

  // WHS 5.9 triggers on submission, so we test the newest round against the
  // rating the player held before it was posted.
  const sorted = [...rounds].sort((a, b) => toTime(b.date) - toTime(a.date));
  if (sorted.length > MIN_ROUNDS_PROVISIONAL) {
    const prior = playerRating(sorted.slice(1));
    if (prior) {
      const bump = exceptionalAdjustment(sorted[0].rating, prior.rating);
      if (bump > 0) {
        rating += bump;
        adjustments.push(
          `Exceptional round: +${bump} points applied to your record (WHS 5.9).`
        );
      }
    }
  }

  // Caps only engage on a full record, matching WHS.
  if (base.sampleSize >= CAP_MIN_ROUNDS) {
    const capped = applyCaps(rating, options.highRating365 ?? null);
    if (capped !== rating) {
      adjustments.push(
        'Rating decrease limited by the soft/hard cap on your 365-day high (WHS 5.8).'
      );
      rating = capped;
    }
  }

  rating = clamp(Math.round(rating), RATING_FLOOR, RATING_CEILING);

  const { unrounded, throws } = courseHandicap(
    rating,
    { ppt },
    targetRating,
    allowance
  );

  const countedSet = new Set(base.countedIndices);

  return {
    rating,
    provisional: base.provisional,
    sampleSize: base.sampleSize,
    countedRounds: base.countedRounds,
    countedIndices: base.countedIndices,
    handicapThrows: throws,
    handicapUnrounded: unrounded,
    targetRating,
    hasEstimatedRounds: rounds.some((r, i) => countedSet.has(i) && r.estimated),
    adjustments,
  };
}
