/** One rating a provider fetched for a pro. */
export interface ProRatingFetch {
  rating: number;
  source: 'manual' | 'pdga_api';
}

/**
 * A source of current pro ratings.
 *
 * The seam that lets the manual, hand-maintained data of today be swapped for
 * the PDGA API later with a single env flag (PRO_RATING_PROVIDER), no change to
 * the sync orchestration. See docs/Feature Enhancements/PRO_HANDICAP_COMPARISON.md.
 */
export interface ProRatingProvider {
  name: 'manual' | 'pdga_api';
  /**
   * Current rating for each PDGA number. A null value means "no rating
   * available for this player" - the sync leaves that pro untouched rather than
   * blanking a known rating.
   */
  fetchRatings(pdgaNumbers: number[]): Promise<Map<number, ProRatingFetch | null>>;
}
