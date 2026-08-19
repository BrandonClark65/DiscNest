import type { ProRatingProvider, ProRatingFetch } from './types';

/**
 * The default provider while ratings are maintained by hand.
 *
 * It has no automated source, so it reports null for every player: the sync
 * then leaves each rating exactly as an admin last set it (via the paste/CSV
 * importer or the admin table) and only refreshes lastSyncedAt. In other words,
 * a scheduled sync under this provider is a harmless heartbeat, and the real
 * updates flow through the importer until the PDGA API is wired in.
 */
export const manualProvider: ProRatingProvider = {
  name: 'manual',
  async fetchRatings(pdgaNumbers: number[]): Promise<Map<number, ProRatingFetch | null>> {
    return new Map(pdgaNumbers.map((n) => [n, null]));
  },
};
