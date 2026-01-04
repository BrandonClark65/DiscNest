'use client';

import { useState, useEffect } from 'react';
import RatingForm from './RatingForm';
import GradientButton from '@/components/ui/GradientButton';
import { X } from 'lucide-react';

interface RatingPromptProps {
  ratedUserId: string;
  ratedUserName: string;
  listingId?: string;
  requestId?: string;
  role: 'buyer' | 'seller';
  onRated?: () => void;
  onDismiss?: () => void;
}

export default function RatingPrompt({
  ratedUserId,
  ratedUserName,
  listingId,
  requestId,
  role,
  onRated,
  onDismiss,
}: RatingPromptProps) {
  const [showForm, setShowForm] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if already dismissed in sessionStorage
  useEffect(() => {
    const dismissedKey = `rating-dismissed-${ratedUserId}-${listingId || requestId || 'general'}`;
    const isDismissed = sessionStorage.getItem(dismissedKey);
    if (isDismissed) {
      setDismissed(true);
    }
  }, [ratedUserId, listingId, requestId]);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    const dismissedKey = `rating-dismissed-${ratedUserId}-${listingId || requestId || 'general'}`;
    sessionStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
    onDismiss?.();
  };

  const handleRated = () => {
    setShowForm(false);
    handleDismiss(); // Auto-dismiss after rating
    onRated?.();
  };

  if (showForm) {
    return (
      <div className="border border-[var(--primary)]/30 rounded-lg p-4 bg-[var(--surface)]/80 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--foreground)]">
            Rate {ratedUserName}
          </h3>
          <button
            onClick={() => setShowForm(false)}
            className="text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <RatingForm
          ratedUserId={ratedUserId}
          listingId={listingId}
          requestId={requestId}
          role={role}
          onSuccess={handleRated}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="border border-[var(--primary)]/30 rounded-lg p-4 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-[var(--foreground)]">
            Rate your experience with {ratedUserName}
          </p>
          <p className="text-sm text-[var(--foreground)]/70 mt-1">
            Help others by sharing your feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GradientButton
            label="Rate Now"
            onClick={() => setShowForm(true)}
            variant="primary"
            className="px-4 py-2"
          />
          <button
            onClick={handleDismiss}
            className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] p-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

