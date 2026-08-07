'use client';

import { Trash2, Star } from 'lucide-react';
import { SOURCE_META, type RoundSource } from '@/app/constants/handicapConfig';
import { formatDateKey } from '@/lib/dateOnly';

export interface DisplayRound {
  _id?: string;
  source: string;
  courseName?: string;
  layoutName?: string;
  /** Midnight UTC of the day played - see `@/lib/dateOnly`. */
  date: string;
  holes: number;
  computedRating: number;
  estimated: boolean;
  roundType?: string;
}

interface RoundsListProps {
  rounds: DisplayRound[];
  /** Indices (into `rounds`) that currently feed the rating. */
  countedIndices: number[];
  onDelete?: (round: DisplayRound, index: number) => void;
}

const cardClass =
  'bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30';

export default function RoundsList({
  rounds,
  countedIndices,
  onDelete,
}: RoundsListProps) {
  const counted = new Set(countedIndices);

  if (rounds.length === 0) {
    return (
      <div className={cardClass}>
        <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-2">
          Your rounds
        </h2>
        <p className="text-muted italic text-[var(--foreground)]/70">
          No rounds yet — add one above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-1">
        Your rounds
      </h2>
      <p className="text-xs text-[var(--foreground)]/60 mb-4">
        A star marks the rounds currently counting toward your rating.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--foreground)]/60 border-b border-[var(--muted)]/30">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Course</th>
              <th className="py-2 pr-3 font-medium">Holes</th>
              <th className="py-2 pr-3 font-medium">Source</th>
              <th className="py-2 pr-3 font-medium text-right">Rating</th>
              <th className="py-2 pl-3" />
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, index) => {
              const meta = SOURCE_META[round.source as RoundSource];
              const isCounted = counted.has(index);
              return (
                <tr
                  key={round._id ?? `${round.date}-${index}`}
                  className="border-b border-[var(--muted)]/15 last:border-0"
                >
                  <td className="py-2 pr-3 whitespace-nowrap text-[var(--foreground)]">
                    <span className="inline-flex items-center gap-1.5">
                      {isCounted && (
                        <Star
                          className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0"
                          aria-label="Counting toward your rating"
                        />
                      )}
                      {formatDateKey(round.date)}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-[var(--foreground)]">
                    {round.courseName || '—'}
                    {round.layoutName && (
                      <span className="text-[var(--foreground)]/60">
                        {' '}
                        · {round.layoutName}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-[var(--foreground)]/80">{round.holes}</td>
                  <td className="py-2 pr-3 text-[var(--foreground)]/80">
                    <span className="inline-flex items-center gap-1.5">
                      {meta?.label ?? round.source}
                      {round.estimated && (
                        <span
                          title={meta?.note}
                          className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)]"
                        >
                          Est
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right font-medium text-[var(--foreground)]">
                    {round.computedRating}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(round, index)}
                        aria-label="Delete round"
                        className="text-[var(--foreground)]/50 hover:text-rose-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
