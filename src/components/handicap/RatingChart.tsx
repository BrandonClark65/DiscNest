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
import type { RatingPoint } from '@/lib/handicap/handicapUtils';

// chart.js requires scales and elements to be registered per component
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/** A saved milestone, overlaid as a highlighted point on the curve. */
export interface ChartMilestone {
  createdAt: string;
  note?: string;
}

interface RatingChartProps {
  /** Rating over time, computed as of each round's own date. */
  history: RatingPoint[];
  /** Manually saved milestones. Matched to the nearest curve point by day. */
  milestones?: ChartMilestone[];
  emptyMessage?: string;
}

/**
 * The rating-over-time line. Shared by the owner's SnapshotHistory card and the
 * public /share/handicap page, so both draw the identical curve.
 */
export default function RatingChart({
  history,
  milestones = [],
  emptyMessage = 'Add at least 3 rounds and your progress will chart itself.',
}: RatingChartProps) {
  // The curve is driven by when rounds were PLAYED, not when they were entered,
  // so backfilling a season shows the real progression instead of a stack of
  // points on today's date.
  const labels = history.map((p) =>
    new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  );

  const milestoneByIndex = new Map<number, ChartMilestone>();
  for (const milestone of milestones) {
    const day = new Date(milestone.createdAt).toISOString().slice(0, 10);
    const idx = history.findIndex((p) => p.date.slice(0, 10) === day);
    if (idx >= 0) milestoneByIndex.set(idx, milestone);
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

  if (history.length === 0) {
    return (
      <p className="text-[var(--foreground)]/70 italic py-8 text-center">{emptyMessage}</p>
    );
  }

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}
