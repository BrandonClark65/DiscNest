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
  snapshots: Snapshot[];
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
}

const cardClass =
  'bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30';

export default function SnapshotHistory({
  snapshots,
  onSave,
  saving,
  canSave,
}: SnapshotHistoryProps) {
  const data = {
    labels: snapshots.map((s) => new Date(s.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'DiscNest Rating',
        data: snapshots.map((s) => s.rating),
        borderColor: '#3c91e6',
        backgroundColor: 'rgba(60, 145, 230, 0.2)',
        tension: 0.3,
        fill: true,
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
            const snapshot = snapshots[ctx.dataIndex];
            if (!snapshot) return '';
            const parts = [`Handicap: ${snapshot.handicapThrows ?? '—'}`];
            if (snapshot.provisional) parts.push('Provisional');
            if (snapshot.note) parts.push(snapshot.note);
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
            Saved automatically whenever your rating changes.
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

      {snapshots.length === 0 ? (
        <p className="text-[var(--foreground)]/70 italic py-8 text-center">
          No snapshots yet. Add rounds and your progress will chart itself.
        </p>
      ) : (
        <div className="h-64">
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  );
}
