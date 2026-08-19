/**
 * "How many throws would you get from a pro?"
 *
 * A thin, presentation-facing wrapper over the same courseHandicap math the
 * rest of the handicap page uses. Keeping it separate from handicapUtils.ts
 * leaves that file as the pure engine and puts the comparison-specific choices
 * (allowance of 1.0, whole-throw headline, per-hole phrasing) in one place.
 */

import { courseHandicap } from './handicapUtils';
import {
  PTS_PER_THROW_STD,
  PRO_COMPARISON_ALLOWANCE,
} from '@/app/constants/handicapConfig';

export interface ProComparison {
  /**
   * Throws the player receives from the pro, rounded to a whole throw for the
   * headline. Negative when the player out-rates the pro (throws they'd give
   * back). The UI is responsible for wording the direction, never for showing a
   * raw signed number - see HandicapSummary for why "+8" reads backwards.
   */
  throws: number;
  /** Unrounded difference, for fine print like "11.6 over 18 holes". */
  unrounded: number;
  /**
   * Whole holes out of 18 the player would take a throw on, magnitude only and
   * capped at 18. Makes the abstract number physical: "a throw on 12 holes".
   */
  perHoles: number;
}

export interface ProComparisonOptions {
  /** Points per throw of the layout. Defaults to the standard scale. */
  ppt?: number;
  /** Override the allowance. Defaults to the pro-comparison allowance (1.0). */
  allowance?: number;
}

/**
 * Compute the throws a player of `playerRating` would receive from a pro rated
 * `proRating`. Both are on the DiscNest/PDGA 1000 scale.
 */
export function throwsFromPro(
  playerRating: number,
  proRating: number,
  options: ProComparisonOptions = {}
): ProComparison {
  const ppt = options.ppt ?? PTS_PER_THROW_STD;
  const allowance = options.allowance ?? PRO_COMPARISON_ALLOWANCE;

  // The pro is the target rating: throws = (proRating - playerRating) / ppt.
  const { unrounded, throws } = courseHandicap(
    playerRating,
    { ppt },
    proRating,
    allowance
  );

  const perHoles = Math.min(18, Math.round(Math.abs(unrounded)));

  return {
    throws: Math.round(throws),
    unrounded,
    perHoles,
  };
}
