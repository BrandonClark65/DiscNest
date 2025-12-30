'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';

interface SellerRatingBadgeProps {
  averageRating: number | null;
  ratingCount: number;
  userId: string;
  username?: string;
  className?: string;
  showCount?: boolean;
}

export default function SellerRatingBadge({
  averageRating,
  ratingCount,
  userId,
  username,
  className = '',
  showCount = true,
}: SellerRatingBadgeProps) {
  // If no ratings, don't show badge
  if (!averageRating || ratingCount === 0) {
    return null;
  }

  const userPath = username ? `/user/${username}` : `/user/${userId}`;

  return (
    <Link
      href={userPath}
      className={`inline-flex items-center gap-1 text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--primary)] transition-colors ${className}`}
      onClick={(e) => {
        // Prevent navigation if clicking on a listing card
        e.stopPropagation();
      }}
    >
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span>{averageRating.toFixed(1)}</span>
      {showCount && (
        <span className="text-[var(--foreground)]/60">
          ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </Link>
  );
}

