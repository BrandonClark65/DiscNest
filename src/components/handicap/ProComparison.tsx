'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Info, Trophy, ArrowRight } from 'lucide-react';
import { throwsFromPro } from '@/lib/handicap/proComparison';
import { PTS_PER_THROW_STD } from '@/app/constants/handicapConfig';
import { trackEvent } from '@/lib/analytics';

const cardClass =
  'bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30';

interface Pro {
  id: string;
  slug: string;
  name: string;
  division: 'MPO' | 'FPO' | string;
  rating: number;
  previousRating: number | null;
  ratingUpdatedAt: string | null;
  blurb: string | null;
}

interface ProComparisonProps {
  /** The player's current DiscNest rating, or null if they have none yet. */
  playerRating: number | null;
  /** Points per throw of the layout. Defaults to the standard scale. */
  ppt?: number;
}

/** "3 weeks ago" style relative label, or null when we have no date. */
function relativeDate(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * "How many throws would you get from a pro?" A named-faces version of the
 * target-rating box in HandicapSummary, running the same math so the two can
 * never disagree. Works fully logged out, and before a player has a rating of
 * their own by letting them type one in.
 */
export default function ProComparison({ playerRating, ppt = PTS_PER_THROW_STD }: ProComparisonProps) {
  const [pros, setPros] = useState<Pro[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Manual rating for visitors with no rating yet. Held as a string so the box
  // can be emptied without snapping back to "0" - same reasoning as the target
  // rating field in HandicapSummary.
  const [draftRating, setDraftRating] = useState('900');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/pros');
        if (!res.ok) throw new Error('Failed to load pros');
        const data = await res.json();
        if (!cancelled) {
          const list: Pro[] = data.pros ?? [];
          setPros(list);
          if (list.length > 0) {
            setSelectedSlug(list[0].slug);
            trackEvent('pro_comparison_view', { results_count: list.length });
          }
        }
      } catch {
        if (!cancelled) setPros([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveRating = useMemo(() => {
    if (playerRating != null) return playerRating;
    const parsed = Number(draftRating);
    return draftRating.trim() !== '' && Number.isFinite(parsed) ? parsed : null;
  }, [playerRating, draftRating]);

  const selectedPro = useMemo(
    () => pros?.find((p) => p.slug === selectedSlug) ?? null,
    [pros, selectedSlug]
  );

  const comparison = useMemo(() => {
    if (!selectedPro || effectiveRating == null) return null;
    return throwsFromPro(effectiveRating, selectedPro.rating, { ppt });
  }, [selectedPro, effectiveRating, ppt]);

  // Nothing seeded yet: render nothing rather than an empty shell.
  if (pros !== null && pros.length === 0) return null;

  const handleSelect = (slug: string) => {
    setSelectedSlug(slug);
    trackEvent('pro_comparison_select', { pro_slug: slug });
  };

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="font-heading text-xl font-semibold text-[var(--foreground)]">
          How many throws would you get from a pro?
        </h2>
      </div>
      <p className="text-sm text-[var(--foreground)]/70 mb-4">
        Pick a touring pro to see how many throws they would spot you.
      </p>

      {pros === null ? (
        <p className="text-[var(--foreground)]/60 italic text-sm py-4">Loading pros…</p>
      ) : (
        <>
          {/* Pro picker */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {pros.map((pro) => {
              const active = pro.slug === selectedSlug;
              return (
                <button
                  key={pro.slug}
                  onClick={() => handleSelect(pro.slug)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--muted)]/30 hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="text-sm font-semibold text-[var(--foreground)] whitespace-nowrap">
                    {pro.name}
                  </div>
                  <div className="text-xs text-[var(--foreground)]/60 whitespace-nowrap">
                    {pro.division} · {pro.rating}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rating input for visitors with no rating yet */}
          {playerRating == null && (
            <div className="mt-4">
              <label
                htmlFor="proCompareRating"
                className="block text-sm font-medium text-[var(--foreground)] mb-2"
              >
                My rating is
              </label>
              <input
                id="proCompareRating"
                type="number"
                step="10"
                inputMode="numeric"
                value={draftRating}
                onChange={(e) => setDraftRating(e.target.value)}
                className="w-40 px-3 py-2 border border-[var(--muted)]/40 rounded-lg bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <p className="mt-1 text-xs text-[var(--foreground)]/60">
                Not sure? 900 is a solid intermediate player. Add a few rounds above for a
                real number.
              </p>
            </div>
          )}

          {/* Result */}
          {selectedPro && comparison && (
            <div className="mt-5">
              <Headline
                proName={selectedPro.name}
                throws={comparison.throws}
                perHoles={comparison.perHoles}
                unrounded={comparison.unrounded}
              />

              {selectedPro.blurb && (
                <p className="mt-2 text-xs text-[var(--foreground)]/60">
                  {selectedPro.name}: {selectedPro.blurb}
                </p>
              )}
            </div>
          )}

          {/* Full experience + sharing lives on the dedicated page */}
          <div className="mt-4">
            <Link
              href={
                selectedSlug
                  ? `/handicap/pros?vs=${encodeURIComponent(selectedSlug)}${
                      effectiveRating != null ? `&r=${effectiveRating}` : ''
                    }`
                  : '/handicap/pros'
              }
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Compare all pros and share your result
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Honesty + freshness */}
          <div className="mt-4 space-y-2">
            <p className="flex items-start gap-2 text-xs text-[var(--foreground)]/60">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              This compares your DiscNest Rating against the pro&apos;s rating on the same
              1000 scale. Your DiscNest Rating is built from the rounds you enter, so it is
              not an official PDGA rating.
            </p>
            {selectedPro && (
              <p className="text-xs text-[var(--foreground)]/50">
                Pro ratings are approximate and maintained by DiscNest
                {relativeDate(selectedPro.ratingUpdatedAt)
                  ? ` · updated ${relativeDate(selectedPro.ratingUpdatedAt)}`
                  : ''}
                .
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** The big number, worded so the direction is never a bare signed value. */
function Headline({
  proName,
  throws,
  perHoles,
  unrounded,
}: {
  proName: string;
  throws: number;
  perHoles: number;
  unrounded: number;
}) {
  if (throws === 0) {
    return (
      <p className="text-lg font-heading font-semibold text-[var(--foreground)]">
        You&apos;re rated dead even with {proName}.
      </p>
    );
  }

  const magnitude = Math.abs(throws);
  const receiving = throws > 0;

  return (
    <div>
      <p className="text-2xl sm:text-3xl font-heading font-bold text-[var(--foreground)]">
        {receiving ? (
          <>
            You&apos;d get{' '}
            <span className="text-gradient-brand">
              {magnitude} throw{magnitude === 1 ? '' : 's'}
            </span>{' '}
            from {proName}
          </>
        ) : (
          <>
            You&apos;d spot {proName}{' '}
            <span className="text-gradient-brand">
              {magnitude} throw{magnitude === 1 ? '' : 's'}
            </span>
          </>
        )}
      </p>
      <p className="mt-1 text-sm text-[var(--foreground)]/60">
        That&apos;s a throw on {perHoles} of 18 holes ({Math.abs(unrounded).toFixed(1)} over 18).
      </p>
    </div>
  );
}
