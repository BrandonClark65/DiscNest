import type { ProRatingProvider, ProRatingFetch } from './types';

/**
 * PDGA REST API provider. NOT YET ENABLED.
 *
 * The intended flow, once a PDGA membership and signed API license are in place
 * (see docs/Feature Enhancements/PRO_HANDICAP_COMPARISON.md):
 *
 *   1. POST https://api.pdga.com/services/json/user/login with
 *      PDGA_API_USERNAME / PDGA_API_PASSWORD, keep the returned session cookie
 *      and CSRF token.
 *   2. For each PDGA number, call the player-search service and read `rating`
 *      (only returned for currently-current members - fine for touring pros).
 *   3. Map number -> { rating, source: 'pdga_api' }; null for any not returned.
 *
 * It is deliberately left throwing rather than half-implemented: it cannot be
 * built or tested without real credentials, and a silent partial implementation
 * could blank ratings. Selecting it (PRO_RATING_PROVIDER=pdga_api) before it is
 * finished should fail loudly.
 */
export const pdgaApiProvider: ProRatingProvider = {
  name: 'pdga_api',
  async fetchRatings(_pdgaNumbers: number[]): Promise<Map<number, ProRatingFetch | null>> {
    throw new Error(
      'PDGA API provider is not yet implemented. Keep PRO_RATING_PROVIDER=manual and use the importer.'
    );
  },
};
