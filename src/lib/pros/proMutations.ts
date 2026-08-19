/** How many rating points to keep in a pro's embedded history. */
export const HISTORY_LIMIT = 24;

/** The subset of a ProPlayer document that a rating update touches. */
export interface MutableProDoc {
  rating: number;
  previousRating?: number;
  ratingUpdatedAt?: Date;
  lastSyncedAt?: Date;
  syncSource?: string;
  history?: Array<{ rating: number; effectiveDate: Date }>;
}

/**
 * Apply a freshly-fetched or freshly-pasted rating to a pro document, in place.
 *
 * Always stamps lastSyncedAt/syncSource so the UI can show when a pro was last
 * checked. Only when the rating actually moved does it advance previousRating,
 * append a history point, and bump ratingUpdatedAt. The caller saves the doc.
 *
 * Returns true when the rating changed, so callers can report it.
 */
export function applyRatingUpdate(
  doc: MutableProDoc,
  newRating: number,
  source: 'manual' | 'pdga_api'
): boolean {
  const now = new Date();
  doc.lastSyncedAt = now;
  doc.syncSource = source;

  if (doc.rating === newRating) return false;

  doc.previousRating = doc.rating;
  doc.rating = newRating;
  doc.ratingUpdatedAt = now;
  doc.history = [...(doc.history ?? []), { rating: newRating, effectiveDate: now }].slice(
    -HISTORY_LIMIT
  );
  return true;
}
