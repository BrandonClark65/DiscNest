'use client';

import { Star } from 'lucide-react';
import Image from 'next/image';

interface Rating {
  _id: string;
  rating: number;
  review?: string;
  createdAt: string;
  rater: {
    _id: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
  } | null;
}

interface RatingsListProps {
  ratings: Rating[];
  averageRating: number | null;
  ratingCount: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function RatingsList({
  ratings,
  averageRating,
  ratingCount,
  currentPage,
  totalPages,
  onPageChange,
}: RatingsListProps) {
  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--foreground)]/60">
        <p>No ratings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--muted)]/30">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {ratingCount} {ratingCount === 1 ? 'Review' : 'Reviews'}
          </h3>
          {averageRating && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-none text-[var(--muted)]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {averageRating.toFixed(1)} out of 5
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.map((rating) => (
          <div
            key={rating._id}
            className="border border-[var(--muted)]/30 rounded-lg p-4 bg-[var(--surface)]/50"
          >
            <div className="flex items-start gap-3">
              {/* Rater Avatar */}
              {rating.rater?.avatarUrl ? (
                <Image
                  src={rating.rater.avatarUrl}
                  alt={rating.rater.name || rating.rater.username || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--muted)]/30 flex items-center justify-center">
                  <span className="text-sm font-medium text-[var(--foreground)]/60">
                    {(rating.rater?.name || rating.rater?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* Rater Name and Rating */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[var(--foreground)]">
                    {rating.rater?.name || rating.rater?.username || 'Anonymous'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= rating.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-none text-[var(--muted)]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[var(--foreground)]/60">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Review Text */}
                {rating.review && (
                  <p className="text-sm text-[var(--foreground)]/80 mt-2 whitespace-pre-wrap">
                    {rating.review}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange((currentPage || 1) - 1)}
            disabled={!currentPage || currentPage <= 1}
            className="px-3 py-1 rounded border border-[var(--muted)]/40 bg-[var(--surface)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--muted)]/20"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--foreground)]/70">
            Page {currentPage || 1} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange((currentPage || 1) + 1)}
            disabled={!currentPage || currentPage >= totalPages}
            className="px-3 py-1 rounded border border-[var(--muted)]/40 bg-[var(--surface)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--muted)]/20"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

