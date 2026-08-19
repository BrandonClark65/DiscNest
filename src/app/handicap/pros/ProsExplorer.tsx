'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Trophy, Info } from 'lucide-react';
import ShareMenu from '@/components/ui/ShareMenu';
import { throwsFromPro } from '@/lib/handicap/proComparison';
import { RATING_FLOOR, RATING_CEILING } from '@/app/constants/handicapConfig';
import { trackEvent } from '@/lib/analytics';
import type { SerializedPro } from '@/lib/pros/proService';

const cardClass =
  'bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30';

interface ProsExplorerProps {
  pros: SerializedPro[];
  initialVs?: string;
  initialR?: number;
}

function validRating(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n) && n >= RATING_FLOOR && n <= RATING_CEILING;
}

export default function ProsExplorer({ pros, initialVs, initialR }: ProsExplorerProps) {
  const firstSlug = pros[0]?.slug ?? null;
  const initialSelected =
    initialVs && pros.some((p) => p.slug === initialVs) ? initialVs : firstSlug;

  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSelected);
  const [draftRating, setDraftRating] = useState(
    validRating(initialR) ? String(initialR) : '900'
  );
  const [origin, setOrigin] = useState('https://www.discnest.com');

  useEffect(() => {
    setOrigin(window.location.origin);
    trackEvent('pro_comparison_view', { results_count: pros.length });
    // Fire once on mount; pros is stable for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveRating = useMemo(() => {
    const parsed = Number(draftRating);
    return draftRating.trim() !== '' && validRating(parsed) ? parsed : null;
  }, [draftRating]);

  const selectedPro = useMemo(
    () => pros.find((p) => p.slug === selectedSlug) ?? null,
    [pros, selectedSlug]
  );

  const comparison = useMemo(
    () =>
      selectedPro && effectiveRating != null
        ? throwsFromPro(effectiveRating, selectedPro.rating)
        : null,
    [selectedPro, effectiveRating]
  );

  // The pro whose rating sits closest to the player, in either direction.
  const closestPro = useMemo(() => {
    if (effectiveRating == null || pros.length === 0) return null;
    return pros.reduce((best, p) =>
      Math.abs(p.rating - effectiveRating) < Math.abs(best.rating - effectiveRating)
        ? p
        : best
    );
  }, [pros, effectiveRating]);

  // Keep the URL in step with the current selection so the link in the address
  // bar (and anything the visitor copies by hand) is always shareable. Uses
  // replaceState to avoid a navigation or server round-trip.
  useEffect(() => {
    if (!selectedSlug) return;
    const params = new URLSearchParams();
    params.set('vs', selectedSlug);
    if (effectiveRating != null) params.set('r', String(effectiveRating));
    window.history.replaceState(null, '', `/handicap/pros?${params.toString()}`);
  }, [selectedSlug, effectiveRating]);

  const handleSelect = (slug: string) => {
    setSelectedSlug(slug);
    trackEvent('pro_comparison_select', { pro_slug: slug });
  };

  const shareQuery =
    selectedSlug && effectiveRating != null
      ? `?vs=${encodeURIComponent(selectedSlug)}&r=${effectiveRating}`
      : '';
  const shareUrl = `${origin}/handicap/pros${shareQuery}`;
  const imageUrl = shareQuery ? `${origin}/api/og/pro-handicap${shareQuery}` : undefined;
  const shareText =
    selectedPro && comparison
      ? comparison.throws >= 0
        ? `I'd get ${Math.abs(comparison.throws)} throw${
            Math.abs(comparison.throws) === 1 ? '' : 's'
          } from ${selectedPro.name}. How many would you get?`
        : `I'd spot ${selectedPro.name} ${Math.abs(comparison.throws)} throw${
            Math.abs(comparison.throws) === 1 ? '' : 's'
          }. How do you stack up?`
      : 'How many throws would you get from a pro? Find out on DiscNest.';

  return (
    <div className="space-y-6">
      {/* Rating input */}
      <div className={cardClass}>
        <label
          htmlFor="proExplorerRating"
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          Your rating
        </label>
        <input
          id="proExplorerRating"
          type="number"
          step="10"
          inputMode="numeric"
          value={draftRating}
          onChange={(e) => setDraftRating(e.target.value)}
          className="w-40 px-3 py-2 border border-[var(--muted)]/40 rounded-lg bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <p className="mt-2 text-xs text-[var(--foreground)]/60">
          Don&apos;t know it?{' '}
          <Link href="/handicap" className="text-[var(--primary)] hover:underline">
            Work it out from your rounds
          </Link>{' '}
          first. 900 is a solid intermediate player.
        </p>

        {closestPro && (
          <p className="mt-3 flex items-center gap-2 text-sm text-[var(--foreground)]/80">
            <Trophy className="w-4 h-4 text-[var(--accent)]" />
            You&apos;re closest to{' '}
            <button
              onClick={() => handleSelect(closestPro.slug)}
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              {closestPro.name}
            </button>{' '}
            ({closestPro.rating}).
          </p>
        )}
      </div>

      {/* Result + share */}
      {selectedPro && comparison && (
        <div className={cardClass}>
          <Headline
            proName={selectedPro.name}
            throws={comparison.throws}
            perHoles={comparison.perHoles}
            unrounded={comparison.unrounded}
          />
          <div className="mt-5">
            <ShareMenu
              url={shareUrl}
              imageUrl={imageUrl}
              title="My disc golf handicap vs the pros"
              text={shareText}
              proSlug={selectedSlug ?? undefined}
            />
          </div>
        </div>
      )}

      {/* Pro grid */}
      <div className={cardClass}>
        <h2 className="font-heading text-lg font-semibold text-[var(--foreground)] mb-3">
          Pick a pro
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {pros.map((pro) => {
            const active = pro.slug === selectedSlug;
            const delta =
              pro.previousRating != null ? pro.rating - pro.previousRating : null;
            return (
              <button
                key={pro.slug}
                onClick={() => handleSelect(pro.slug)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--muted)]/30 hover:border-[var(--primary)]/50'
                }`}
              >
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {pro.name}
                </div>
                <div className="text-xs text-[var(--foreground)]/60 mt-0.5">
                  {pro.division} · {pro.rating}
                  {delta != null && delta !== 0 && (
                    <span
                      className={delta > 0 ? 'text-green-600 ml-1' : 'text-red-500 ml-1'}
                    >
                      {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-[var(--foreground)]/60">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Comparison uses your rating against the pro&apos;s on the same 1000 scale. Pro
        ratings are approximate and maintained by DiscNest. A DiscNest Rating is not an
        official PDGA rating.
      </p>
    </div>
  );
}

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
      <p className="text-xl font-heading font-semibold text-[var(--foreground)]">
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
