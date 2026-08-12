'use client';

import GradientButton from '@/components/ui/GradientButton';
import RatingChart from './RatingChart';
import type { RatingPoint } from '@/lib/handicap/handicapUtils';

export interface Snapshot {
  _id: string;
  rating: number;
  handicapThrows: number | null;
  provisional: boolean;
  trigger: string;
  note?: string;
  createdAt: string;
}

interface SnapshotHistoryProps {
  /** Rating over time, computed as of each round's own date. */
  history: RatingPoint[];
  /** Manually saved milestones, overlaid as points on the curve. */
  snapshots: Snapshot[];
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
}

const cardClass =
  'bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30';

export default function SnapshotHistory({
  history,
  snapshots,
  onSave,
  saving,
  canSave,
}: SnapshotHistoryProps) {
  // Auto snapshots exist only to feed the WHS 365-day high; the chart marks the
  // ones the player deliberately saved.
  const milestones = snapshots
    .filter((s) => s.trigger === 'manual')
    .map((s) => ({ createdAt: s.createdAt, note: s.note }));

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-[var(--foreground)]">
            Your progress
          </h2>
          <p className="text-xs text-[var(--foreground)]/60 mt-1">
            Your rating as it stood after each round you played. Orange points are
            snapshots you saved.
          </p>
        </div>
        <GradientButton
          label={saving ? 'Saving...' : 'Save snapshot'}
          variant="primary"
          onClick={onSave}
          className="px-4 py-2 text-sm"
          disabled={saving || !canSave}
        />
      </div>

      <RatingChart history={history} milestones={milestones} />
    </div>
  );
}
