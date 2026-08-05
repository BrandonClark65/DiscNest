'use client';

import { Info, TrendingUp } from 'lucide-react';
import type { HandicapResult } from '@/lib/handicap/handicapUtils';
import {
  MIN_ROUNDS_PROVISIONAL,
  MIN_ROUNDS_ESTABLISHED,
} from '@/app/constants/handicapConfig';

interface HandicapSummaryProps {
  result: HandicapResult | null;
  targetRating: number;
  onTargetRatingChange: (value: number) => void;
}

const cardClass =
  'bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30';

export default function HandicapSummary({
  result,
  targetRating,
  onTargetRatingChange,
}: HandicapSummaryProps) {
  const rounds = result?.sampleSize ?? 0;
  const needed = MIN_ROUNDS_PROVISIONAL - rounds;

  if (!result || result.rating == null) {
    return (
      <div className={cardClass}>
        <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-2">
          Your handicap
        </h2>
        <p className="text-[var(--foreground)]/70">
          {rounds === 0
            ? `Add ${MIN_ROUNDS_PROVISIONAL} rounds to see your rating and handicap.`
            : `${needed} more round${needed === 1 ? '' : 's'} to go — we need at least ${MIN_ROUNDS_PROVISIONAL} before showing a number.`}
        </p>
        <p className="mt-2 text-xs text-[var(--foreground)]/60">
          We deliberately won&apos;t show a handicap off one or two rounds. It would be
          noise, not a measurement.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h2 className="font-heading text-xl font-semibold text-[var(--foreground)]">
          Your handicap
        </h2>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            result.provisional
              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
              : 'bg-[var(--primary)]/15 text-[var(--primary)]'
          }`}
        >
          {result.provisional
            ? `Provisional · ${rounds}/${MIN_ROUNDS_ESTABLISHED} rounds`
            : `Established · ${rounds} rounds`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-4xl font-heading font-bold text-gradient-brand">
            {result.rating}
          </div>
          <div className="text-xs uppercase tracking-wide text-[var(--foreground)]/60 mt-1">
            DiscNest Rating
          </div>
        </div>
        <div>
          <div className="text-4xl font-heading font-bold text-[var(--foreground)]">
            {result.handicapThrows != null && result.handicapThrows > 0 ? '+' : ''}
            {result.handicapThrows}
          </div>
          <div className="text-xs uppercase tracking-wide text-[var(--foreground)]/60 mt-1">
            Handicap (throws)
          </div>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="targetRating"
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          Playing against a target rating of
        </label>
        <input
          id="targetRating"
          type="number"
          step="10"
          value={targetRating}
          onChange={(e) => onTargetRatingChange(Number(e.target.value))}
          className="w-40 px-3 py-2 border border-[var(--muted)]/40 rounded-lg bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <p className="mt-1 text-xs text-[var(--foreground)]/60">
          1000 is scratch. Leagues often play to their own target, like 900.
        </p>
      </div>

      <p className="mt-4 text-xs text-[var(--foreground)]/60">
        Based on the best {result.countedRounds} of your last {rounds} round
        {rounds === 1 ? '' : 's'}.
      </p>

      {result.adjustments.length > 0 && (
        <ul className="mt-3 space-y-1">
          {result.adjustments.map((adjustment) => (
            <li
              key={adjustment}
              className="flex items-start gap-2 text-xs text-[var(--foreground)]/70"
            >
              <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {adjustment}
            </li>
          ))}
        </ul>
      )}

      {result.hasEstimatedRounds && (
        <p className="mt-3 flex items-start gap-2 text-xs text-[var(--foreground)]/70">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Some counted rounds use an estimated conversion, so treat this number as
          approximate.
        </p>
      )}

      <p className="mt-3 flex items-start gap-2 text-xs text-[var(--foreground)]/60">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        A DiscNest Rating is not a PDGA rating. It uses the same 1000 scale so it reads
        the same way, but it&apos;s built from the rounds you enter here, so it will
        differ from your official number.
      </p>
    </div>
  );
}
