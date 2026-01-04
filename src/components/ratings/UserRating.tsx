'use client';

import { Star } from 'lucide-react';

interface UserRatingProps {
  averageRating: number | null;
  ratingCount: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserRating({
  averageRating,
  ratingCount,
  showLabel = true,
  size = 'md',
  className = '',
}: UserRatingProps) {
  if (!averageRating || ratingCount === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-[var(--foreground)]/60 text-sm">No ratings yet</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Calculate number of filled stars (round to nearest)
  const filledStars = Math.round(averageRating);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= filledStars
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-[var(--muted)]'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className={`font-semibold ${textSizeClasses[size]}`}>
          {averageRating.toFixed(1)}
        </span>
        {showLabel && (
          <span className={`text-[var(--foreground)]/60 ${textSizeClasses[size]}`}>
            ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </div>
    </div>
  );
}

