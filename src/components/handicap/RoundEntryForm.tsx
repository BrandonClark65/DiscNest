'use client';

import { useState } from 'react';
import GradientButton from '@/components/ui/GradientButton';
import toast from 'react-hot-toast';
import { localDateKey } from '@/lib/dateOnly';
import {
  ROUND_SOURCES,
  ROUND_TYPES,
  SOURCE_META,
  MIN_HOLES,
  MAX_HOLES,
  type RoundSource,
  type RoundType,
} from '@/app/constants/handicapConfig';

export interface RoundFormValues {
  source: RoundSource;
  courseName: string;
  layoutName: string;
  date: string;
  holes: number;
  score: string;
  ssa: string;
  par: string;
  providedRating: string;
  roundType: RoundType;
}

const emptyForm = (): RoundFormValues => ({
  source: 'pdga',
  courseName: '',
  layoutName: '',
  date: localDateKey(),
  holes: 18,
  score: '',
  ssa: '',
  par: '',
  providedRating: '',
  roundType: 'casual',
});

interface RoundEntryFormProps {
  /** Receives the validated payload; resolve false to keep the form filled. */
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
  initial?: Partial<RoundFormValues>;
  submitLabel?: string;
  onCancel?: () => void;
}

const inputClass =
  'w-full px-3 py-2 border border-[var(--muted)]/40 rounded-lg bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]';

export default function RoundEntryForm({
  onSubmit,
  initial,
  submitLabel = 'Add round',
  onCancel,
}: RoundEntryFormProps) {
  const [form, setForm] = useState<RoundFormValues>({ ...emptyForm(), ...initial });
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof RoundFormValues>(key: K, value: RoundFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const meta = SOURCE_META[form.source];
  const needsScore = form.source === 'score_ssa' || form.source === 'score_par';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date) {
      toast.error('Please pick a date for this round');
      return;
    }

    const holes = Number(form.holes);
    if (!Number.isFinite(holes) || holes < MIN_HOLES || holes > MAX_HOLES) {
      toast.error(`Holes must be between ${MIN_HOLES} and ${MAX_HOLES}`);
      return;
    }

    const payload: Record<string, unknown> = {
      source: form.source,
      courseName: form.courseName.trim() || undefined,
      layoutName: form.layoutName.trim() || undefined,
      date: form.date,
      holes,
      roundType: form.roundType,
      completed: true,
    };

    if (form.source === 'pdga' || form.source === 'udisc') {
      const rating = Number(form.providedRating);
      if (!form.providedRating || !Number.isFinite(rating)) {
        toast.error(
          form.source === 'pdga'
            ? 'Enter the round rating from your PDGA event page'
            : 'Enter your UDisc round rating'
        );
        return;
      }
      payload.providedRating = rating;
    } else {
      const score = Number(form.score);
      if (!form.score || !Number.isFinite(score)) {
        toast.error('Enter your total score for the round');
        return;
      }
      payload.score = score;

      if (form.source === 'score_ssa') {
        const ssa = Number(form.ssa);
        if (!form.ssa || !Number.isFinite(ssa)) {
          toast.error('Enter the course rating (SSA) for this layout');
          return;
        }
        payload.ssa = ssa;
      } else {
        const par = Number(form.par);
        if (!form.par || !Number.isFinite(par)) {
          toast.error('Enter the par for this layout');
          return;
        }
        payload.par = par;
      }
    }

    setSubmitting(true);
    try {
      const ok = await onSubmit(payload);
      if (ok) setForm(emptyForm());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="source"
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          How do you want to enter this round? *
        </label>
        <select
          id="source"
          value={form.source}
          onChange={(e) => set('source', e.target.value as RoundSource)}
          className={inputClass}
        >
          {ROUND_SOURCES.map((source) => (
            <option key={source} value={source}>
              {SOURCE_META[source].label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--foreground)]/60">{meta.note}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="courseName"
            className="block text-sm font-medium text-[var(--foreground)] mb-2"
          >
            Course
          </label>
          <input
            id="courseName"
            type="text"
            value={form.courseName}
            onChange={(e) => set('courseName', e.target.value)}
            placeholder="e.g. Maple Hill"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="layoutName"
            className="block text-sm font-medium text-[var(--foreground)] mb-2"
          >
            Layout
          </label>
          <input
            id="layoutName"
            type="text"
            value={form.layoutName}
            onChange={(e) => set('layoutName', e.target.value)}
            placeholder="e.g. Gold tees"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-[var(--foreground)] mb-2"
          >
            Date *
          </label>
          <input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="holes"
            className="block text-sm font-medium text-[var(--foreground)] mb-2"
          >
            Holes *
          </label>
          <input
            id="holes"
            type="number"
            min={MIN_HOLES}
            max={MAX_HOLES}
            value={form.holes}
            onChange={(e) => set('holes', Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="roundType"
            className="block text-sm font-medium text-[var(--foreground)] mb-2"
          >
            Round type
          </label>
          <select
            id="roundType"
            value={form.roundType}
            onChange={(e) => set('roundType', e.target.value as RoundType)}
            className={inputClass}
          >
            {ROUND_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!needsScore && (
        <div>
          <label
            htmlFor="providedRating"
            className="block text-sm font-medium text-[var(--foreground)] mb-2"
          >
            {form.source === 'pdga' ? 'PDGA round rating *' : 'UDisc round rating *'}
          </label>
          <input
            id="providedRating"
            type="number"
            value={form.providedRating}
            onChange={(e) => set('providedRating', e.target.value)}
            placeholder={form.source === 'pdga' ? '942' : '185'}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[var(--foreground)]/60">
            {form.source === 'pdga'
              ? 'Find this on your player page at pdga.com under each event.'
              : 'UDisc ratings use a 1–300 scale. We convert it to the 1000 scale - see the note above.'}
          </p>
        </div>
      )}

      {needsScore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="score"
              className="block text-sm font-medium text-[var(--foreground)] mb-2"
            >
              Your total score *
            </label>
            <input
              id="score"
              type="number"
              value={form.score}
              onChange={(e) => set('score', e.target.value)}
              placeholder="58"
              className={inputClass}
            />
          </div>
          {form.source === 'score_ssa' ? (
            <div>
              <label
                htmlFor="ssa"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Course rating / SSA *
              </label>
              <input
                id="ssa"
                type="number"
                step="0.1"
                value={form.ssa}
                onChange={(e) => set('ssa', e.target.value)}
                placeholder="50.5"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-[var(--foreground)]/60">
                The score a 1000-rated player is expected to shoot here.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="par"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                Par *
              </label>
              <input
                id="par"
                type="number"
                value={form.par}
                onChange={(e) => set('par', e.target.value)}
                placeholder="54"
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

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
          label={submitting ? 'Saving...' : submitLabel}
          variant="primary"
          type="submit"
          className="px-4 py-2"
          disabled={submitting}
        />
      </div>
    </form>
  );
}
