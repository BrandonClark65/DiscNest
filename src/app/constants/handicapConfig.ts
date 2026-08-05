/**
 * Tunable constants for the DiscNest handicap calculator.
 *
 * The system combines two published methods:
 *  - Round ratings use the PDGA formula: 1000 + (SSA - score) * pointsPerThrow
 *  - Player ratings use the USGA World Handicap System's "best 8 of last 20"
 *    selection, which is far harder to game with self-reported scores than
 *    PDGA's weighted average.
 *
 * See docs in src/lib/handicap/handicapUtils.ts for the reasoning.
 */

/** Rating points equal to one throw on a typical 18-hole layout. */
export const PTS_PER_THROW_STD = 10;

/** The rating a "scratch" player is defined to have. */
export const SCRATCH_RATING = 1000;

/**
 * PDGA's published points-per-throw anchors, normalized to 18 holes.
 * Easy layouts compress scores (more points per throw); long or hard
 * layouts spread them out (fewer points per throw). This is disc golf's
 * equivalent of golf's Slope Rating, inverted.
 */
export const PPT_ANCHORS: ReadonlyArray<{ ssa18: number; ppt: number }> = [
  { ssa18: 44, ppt: 13 },
  { ssa18: 50, ppt: 10 },
  { ssa18: 68, ppt: 6 },
];

/** Sanity clamp on any derived or interpolated points-per-throw value. */
export const PPT_MIN = 4;
export const PPT_MAX = 16;

/**
 * UDisc publishes round ratings on a separate 1-300+ scale and explicitly
 * declines to provide a mapping to the PDGA 1000 scale, so this conversion is
 * unofficial. The linear form below fits the anchor pairs players report:
 * UDisc 173 -> ~830, 200 -> ~900, 250 -> ~1000, 312 -> ~1120.
 *
 * Tune these two numbers once real DiscNest users have entered rounds from
 * both sources - our own data will beat a community rule of thumb.
 */
export const UDISC_CONVERSION = { slope: 2, intercept: 500 } as const;

/** Plausible input range for a UDisc round rating. */
export const UDISC_MIN = 1;
export const UDISC_MAX = 400;

/**
 * USGA World Handicap System 5.2a. `use` is how many of the best differentials
 * count; `adjustment` is in strokes and is a penalty in golf terms, so on a
 * scale where higher is better it SUBTRACTS. Getting that sign backwards is
 * the easiest bug to ship here.
 */
export const WHS_SMALL_SAMPLE_TABLE: ReadonlyArray<{
  min: number;
  max: number;
  use: number;
  adjustment: number;
}> = [
  { min: 3, max: 3, use: 1, adjustment: -2.0 },
  { min: 4, max: 4, use: 1, adjustment: -1.0 },
  { min: 5, max: 5, use: 1, adjustment: 0 },
  { min: 6, max: 6, use: 2, adjustment: -1.0 },
  { min: 7, max: 8, use: 2, adjustment: 0 },
  { min: 9, max: 11, use: 3, adjustment: 0 },
  { min: 12, max: 14, use: 4, adjustment: 0 },
  { min: 15, max: 16, use: 5, adjustment: 0 },
  { min: 17, max: 18, use: 6, adjustment: 0 },
  { min: 19, max: 19, use: 7, adjustment: 0 },
  { min: 20, max: 20, use: 8, adjustment: 0 },
];

/** Only the most recent N rounds are considered. */
export const ROUND_WINDOW = 20;

/** Below this many rounds we refuse to show a number at all. */
export const MIN_ROUNDS_PROVISIONAL = 3;

/** At or above this many rounds the rating is no longer flagged provisional. */
export const MIN_ROUNDS_ESTABLISHED = 8;

/**
 * WHS 5.8 soft/hard cap, converted to rating points at PTS_PER_THROW_STD.
 * Limits how fast a rating can fall relative to its 365-day high, which stops
 * a player from quietly inflating their handicap before a league night.
 */
export const SOFT_CAP_PTS = 3.0 * PTS_PER_THROW_STD;
export const HARD_CAP_PTS = 5.0 * PTS_PER_THROW_STD;

/** Caps only engage once the record is full - matches WHS. */
export const CAP_MIN_ROUNDS = ROUND_WINDOW;

/**
 * WHS 5.9 exceptional score reduction, on the 1000 scale. A round this far
 * above the player's current rating bumps every stored round rating, catching
 * the player who banks bad rounds then dumps one brilliant one.
 */
export const EXCEPTIONAL_TIER_1_PTS = 7.0 * PTS_PER_THROW_STD;
export const EXCEPTIONAL_TIER_2_PTS = 10.0 * PTS_PER_THROW_STD;
export const EXCEPTIONAL_ADJ_1 = 1.0 * PTS_PER_THROW_STD;
export const EXCEPTIONAL_ADJ_2 = 2.0 * PTS_PER_THROW_STD;

/** WHS Appendix C: individual stroke play allowance. */
export const DEFAULT_ALLOWANCE = 0.95;

/** Accepted hole counts for a submitted round. */
export const MIN_HOLES = 6;
export const MAX_HOLES = 36;

/** Guard rails on raw score entry. */
export const MIN_SCORE = 1;
export const MAX_SCORE = 300;

/** Where a player's round rating can plausibly land. */
export const RATING_FLOOR = 0;
export const RATING_CEILING = 1400;

export const HANDICAP_CONFIG = {
  PTS_PER_THROW_STD,
  SCRATCH_RATING,
  PPT_MIN,
  PPT_MAX,
  ROUND_WINDOW,
  MIN_ROUNDS_PROVISIONAL,
  MIN_ROUNDS_ESTABLISHED,
  SOFT_CAP_PTS,
  HARD_CAP_PTS,
  DEFAULT_ALLOWANCE,
} as const;

/** Input sources a round rating can come from, ordered by trustworthiness. */
export const ROUND_SOURCES = ['pdga', 'score_ssa', 'udisc', 'score_par'] as const;
export type RoundSource = (typeof ROUND_SOURCES)[number];

export const ROUND_TYPES = ['casual', 'league', 'tournament'] as const;
export type RoundType = (typeof ROUND_TYPES)[number];

/** Human-facing labels and honesty notes for each input source. */
export const SOURCE_META: Record<
  RoundSource,
  { label: string; trust: 'exact' | 'good' | 'estimated' | 'rough'; note: string }
> = {
  pdga: {
    label: 'PDGA round rating',
    trust: 'exact',
    note: 'Taken straight from your PDGA event page. The most accurate option.',
  },
  score_ssa: {
    label: 'Score + course rating (SSA)',
    trust: 'good',
    note: 'Uses the layout’s scratch scoring average, so course difficulty is accounted for.',
  },
  udisc: {
    label: 'UDisc round rating',
    trust: 'estimated',
    note: 'UDisc uses a separate 1–300 scale and publishes no official conversion, so this is an estimate.',
  },
  score_par: {
    label: 'Score + par',
    trust: 'rough',
    note: 'Par is a weak difficulty signal in disc golf — many courses list a flat 54. Treat as rough.',
  },
};
