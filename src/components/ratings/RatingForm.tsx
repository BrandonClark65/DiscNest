'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import toast from 'react-hot-toast';
import { RATING_CONFIG } from '@/app/constants/ratingConfig';

interface RatingFormProps {
  ratedUserId: string;
  listingId?: string;
  requestId?: string;
  role: 'buyer' | 'seller';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RatingForm({
  ratedUserId,
  listingId,
  requestId,
  role,
  onSuccess,
  onCancel,
}: RatingFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (review.length > RATING_CONFIG.MAX_REVIEW_LENGTH) {
      toast.error(`Review must be ${RATING_CONFIG.MAX_REVIEW_LENGTH} characters or less`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratedUserId,
          listingId,
          requestId,
          rating,
          review: review.trim() || undefined,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }

      toast.success('Rating submitted successfully!');
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit rating';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Rating *
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded"
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-none text-[var(--muted)]'
                }`}
              />
            </button>
          ))}
          {displayRating > 0 && (
            <span className="ml-2 text-sm text-[var(--foreground)]/70">
              {displayRating} / 5
            </span>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="review" className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Review (optional)
        </label>
        <textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          maxLength={RATING_CONFIG.MAX_REVIEW_LENGTH}
          rows={4}
          className="w-full px-3 py-2 border border-[var(--muted)]/40 rounded-lg bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
          placeholder="Share your experience..."
        />
        <div className="mt-1 text-xs text-[var(--foreground)]/60 text-right">
          {review.length} / {RATING_CONFIG.MAX_REVIEW_LENGTH}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <GradientButton
            label="Cancel"
            onClick={onCancel}
            variant="accentGradient"
            className="px-4 py-2"
          />
        )}
        <GradientButton
          label={submitting ? 'Submitting...' : 'Submit Rating'}
          variant="primary"
          type="submit"
          className="px-4 py-2"
          disabled={submitting || rating === 0}
        />
      </div>
    </form>
  );
}

