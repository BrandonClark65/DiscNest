'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import GradientButton from '@/components/ui/GradientButton';
import type { RatingPoint } from '@/lib/handicap/handicapUtils';
import { formatDateKey, toDateKey, localDateKey } from '@/lib/dateOnly';

// chart.js requires scales and elements to be registered per component
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  // The curve is driven by when rounds were PLAYED, not when they were entered,
  // so backfilling a season shows the real progression instead of a stack of
  // points on today's date.
  const labels = history.map((p) =>
    formatDateKey(p.date, { month: 'short', day: 'numeric' })
  );

  // Milestones are matched to the nearest curve point by day. The two sides are
  // read in different zones on purpose: a curve point is a calendar day stored
  // as midnight UTC, while `createdAt` is a real instant, so the day it belongs
  // to is the viewer's day - otherwise an evening save west of UTC matches the
  // following day's round, or no round at all.
  const milestoneByIndex = new Map<number, Snapshot>();
  for (const snapshot of snapshots) {
    if (snapshot.trigger !== 'manual') continue;
    const day = localDateKey(new Date(snapshot.createdAt));
    const idx = history.findIndex((p) => toDateKey(p.date) === day);
    if (idx >= 0) milestoneByIndex.set(idx, snapshot);
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'DiscNest Rating',
        data: history.map((p) => p.rating),
        borderColor: '#3c91e6',
        backgroundColor: 'rgba(60, 145, 230, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: history.map((_, i) => (milestoneByIndex.has(i) ? 5 : 2)),
        pointBackgroundColor: history.map((_, i) =>
          milestoneByIndex.has(i) ? '#f17300' : '#3c91e6'
        ),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: (ctx: { dataIndex: number }) => {
            const point = history[ctx.dataIndex];
            if (!point) return '';
            const parts = [`After ${point.sampleSize} round${point.sampleSize === 1 ? '' : 's'}`];
            if (point.provisional) parts.push('Provisional');
            const milestone = milestoneByIndex.get(ctx.dataIndex);
            if (milestone?.note) parts.push(milestone.note);
            else if (milestone) parts.push('Saved snapshot');
            return parts.join(' · ');
          },
        },
      },
    },
    scales: {
      y: {
        // Ratings cluster in a narrow band, so a zero-based axis would flatten
        // the line into uselessness.
        beginAtZero: false,
      },
    },
  };

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

      {history.length === 0 ? (
        <p className="text-[var(--foreground)]/70 italic py-8 text-center">
          Add at least 3 rounds and your progress will chart itself.
        </p>
      ) : (
        <div className="h-64">
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  );
}
