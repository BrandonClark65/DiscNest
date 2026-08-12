'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import GradientButton from '@/components/ui/GradientButton';
import ShareButton from '@/components/ui/ShareButton';
import RoundEntryForm from './RoundEntryForm';
import HandicapSummary from './HandicapSummary';
import RoundsList, { type DisplayRound } from './RoundsList';
import SnapshotHistory, { type Snapshot } from './SnapshotHistory';
import {
  computeHandicap,
  ratingHistory,
  roundRating,
  type ScoredRound,
  type HandicapResult,
  type RoundInput,
} from '@/lib/handicap/handicapUtils';
import {
  SCRATCH_RATING,
  PTS_PER_THROW_STD,
  type RoundSource,
} from '@/app/constants/handicapConfig';

const cardClass =
  'bg-[var(--surface)] p-5 rounded-2xl shadow-md border border-[var(--muted)]/30';

/**
 * Logged-out rounds live in localStorage, not just React state.
 *
 * Signing in navigates away from this page, which destroys component state - so
 * without this a visitor who enters ten rounds and then clicks "Log in to save"
 * loses every one of them at exactly the moment they tried to keep them.
 */
const PENDING_KEY = 'discnest:handicap:pending-rounds';

/**
 * A locally-held round keeps the original payload so it can be POSTed later.
 * Rounds loaded from the API have no payload - they are already saved.
 */
type LocalRound = DisplayRound & { payload?: Record<string, unknown> };

function loadPending(): LocalRound[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePending(rounds: LocalRound[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(rounds));
  } catch {
    // Private browsing or a full quota - the in-memory rounds still work.
  }
}

function clearPending() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to do.
  }
}

/**
 * The calculator works fully logged out, holding rounds in local state, and
 * switches to the API once the visitor signs in. Both paths call the same
 * computeHandicap, so the numbers never disagree.
 */
export default function HandicapCalculator() {
  const { data: session, status } = useSession();
  const loggedIn = Boolean(session?.user);

  const [rounds, setRounds] = useState<LocalRound[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [serverResult, setServerResult] = useState<HandicapResult | null>(null);
  const [targetRating, setTargetRating] = useState(SCRATCH_RATING);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Rounds entered before signing in, waiting to be claimed by an account.
  const [pending, setPending] = useState<LocalRound[]>([]);
  const [importing, setImporting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // ---- data loading (logged in only) ------------------------------------
  const fetchRounds = useCallback(async () => {
    setLoading(true);
    try {
      const [roundsRes, snapshotsRes] = await Promise.all([
        fetch('/api/handicap/rounds'),
        fetch('/api/handicap/snapshots'),
      ]);
      if (!roundsRes.ok) throw new Error('Failed to load rounds');

      const roundsData = await roundsRes.json();
      setRounds(roundsData.rounds ?? []);
      setServerResult(roundsData.handicap ?? null);

      if (snapshotsRes.ok) {
        const snapshotData = await snapshotsRes.json();
        setSnapshots(snapshotData.snapshots ?? []);
      }
    } catch {
      toast.error('Could not load your rounds.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) fetchRounds();
  }, [loggedIn, fetchRounds]);

  // ---- pending (logged-out) rounds ---------------------------------------
  // Hydrate once on mount. Runs in an effect rather than useState's initializer
  // so the server-rendered markup and the first client render agree.
  useEffect(() => {
    if (status === 'loading') return;
    const stored = loadPending();
    if (loggedIn) {
      // Signed in with rounds left over from before - offer to claim them.
      if (stored.length > 0) setPending(stored);
    } else if (stored.length > 0) {
      setRounds(stored);
    }
    setHydrated(true);
  }, [status, loggedIn]);

  // Persist every change while logged out, so navigating to /login is safe.
  useEffect(() => {
    if (!hydrated || loggedIn) return;
    if (rounds.length > 0) savePending(rounds);
    else clearPending();
  }, [rounds, hydrated, loggedIn]);

  /** Save rounds entered before signing in into the now-authenticated account. */
  const handleClaimPending = async () => {
    setImporting(true);
    let saved = 0;
    try {
      for (const round of pending) {
        if (!round.payload) continue;
        const res = await fetch('/api/handicap/rounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(round.payload),
        });
        if (res.ok) saved += 1;
      }

      if (saved === pending.length) {
        toast.success(`Saved ${saved} round${saved === 1 ? '' : 's'} to your account.`);
      } else {
        toast.error(`Saved ${saved} of ${pending.length} rounds. Please re-check the rest.`);
      }

      clearPending();
      setPending([]);
      await fetchRounds();
    } catch {
      toast.error('Could not save your rounds. They are still here - try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleDiscardPending = () => {
    clearPending();
    setPending([]);
    toast.success('Discarded the unsaved rounds.');
  };

  // ---- local computation -------------------------------------------------
  // Logged out we compute in the browser. Logged in we still recompute
  // locally so changing the target rating updates instantly, without a
  // round trip - the server remains the authority on the stored rating.
  const localResult = useMemo(() => {
    const scored: ScoredRound[] = rounds.map((r) => ({
      rating: r.computedRating,
      date: r.date,
      holes: r.holes,
      estimated: r.estimated,
    }));
    return computeHandicap(scored, {
      targetRating,
      ppt: PTS_PER_THROW_STD,
    });
  }, [rounds, targetRating]);

  const result =
    loggedIn && serverResult && targetRating === serverResult.targetRating
      ? serverResult
      : localResult;

  // The progress curve is derived from the rounds themselves, so it is correct
  // the moment a backfill finishes - no snapshot rows required.
  const history = useMemo(
    () =>
      ratingHistory(
        rounds.map((r) => ({
          rating: r.computedRating,
          date: r.date,
          holes: r.holes,
          estimated: r.estimated,
        }))
      ),
    [rounds]
  );

  // ---- sharing -----------------------------------------------------------
  // Two links, depending on who is looking. A signed-in player with a rating
  // shares their own /share/handicap page; anyone else shares the calculator.
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('https://www.discnest.com/handicap');

  useEffect(() => {
    setPageUrl(`${window.location.origin}/handicap`);
  }, []);

  const canShareHandicap = loggedIn && result.rating != null;

  useEffect(() => {
    if (!canShareHandicap) {
      // Signing out must not leave the previous account's link on screen.
      setShareUrl(null);
      return;
    }
    if (shareUrl) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/handicap/share', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to create share link');
        const data = await res.json();
        if (!cancelled) setShareUrl(data.shareUrl);
      } catch {
        // Sharing is a nicety - stay quiet and fall back to the page link.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canShareHandicap, shareUrl]);

  // ---- mutations ---------------------------------------------------------
  const handleAddRound = async (payload: Record<string, unknown>): Promise<boolean> => {
    if (!loggedIn) {
      // Rate it in the browser and persist locally. The original payload rides
      // along so the round can be replayed to the API after signing in.
      try {
        const rated = roundRating({
          source: payload.source as RoundSource,
          holes: payload.holes as number,
          score: payload.score as number | undefined,
          ssa: payload.ssa as number | undefined,
          par: payload.par as number | undefined,
          providedRating: payload.providedRating as number | undefined,
        } as RoundInput);

        setRounds((prev) =>
          [
            {
              source: payload.source as string,
              courseName: payload.courseName as string | undefined,
              layoutName: payload.layoutName as string | undefined,
              date: new Date(payload.date as string).toISOString(),
              holes: payload.holes as number,
              computedRating: rated.rating,
              estimated: rated.estimated,
              roundType: payload.roundType as string,
              payload,
            },
            ...prev,
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
        toast.success('Round added.');
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not rate that round.');
        return false;
      }
    }

    try {
      const res = await fetch('/api/handicap/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add round');
      }
      toast.success('Round saved.');
      await fetchRounds();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add round');
      return false;
    }
  };

  const handleDeleteRound = async (round: DisplayRound, index: number) => {
    if (!loggedIn || !round._id) {
      setRounds((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    try {
      const res = await fetch(`/api/handicap/rounds/${round._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete round');
      toast.success('Round deleted.');
      await fetchRounds();
    } catch {
      toast.error('Failed to delete round.');
    }
  };

  const handleSaveSnapshot = async () => {
    if (!loggedIn) return;
    setSaving(true);
    try {
      const res = await fetch('/api/handicap/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRating }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save snapshot');
      }
      toast.success('Snapshot saved.');
      await fetchRounds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save snapshot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {loggedIn && pending.length > 0 && (
        <div className="bg-[var(--primary)]/10 p-5 rounded-2xl border border-[var(--primary)]/30">
          <h2 className="font-heading text-lg font-semibold text-[var(--foreground)] mb-1">
            You have {pending.length} unsaved round{pending.length === 1 ? '' : 's'}
          </h2>
          <p className="text-sm text-[var(--foreground)]/75 mb-4">
            These were entered before you signed in. Save them to your account so they
            count toward your handicap.
          </p>
          <div className="flex gap-3 flex-wrap">
            <GradientButton
              label={importing ? 'Saving...' : `Save ${pending.length} to my account`}
              variant="primary"
              onClick={handleClaimPending}
              className="px-5 py-2 text-sm"
              disabled={importing}
            />
            <GradientButton
              label="Discard"
              variant="muted"
              onClick={handleDiscardPending}
              className="px-5 py-2 text-sm"
              disabled={importing}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        {shareUrl ? (
          <ShareButton
            title="My disc golf handicap"
            text={`My DiscNest rating is ${result.rating} — see my rounds and handicap.`}
            url={shareUrl}
            label="Share my handicap"
          />
        ) : (
          <ShareButton
            title="Disc golf handicap calculator"
            text="Work out your disc golf handicap free on DiscNest."
            url={pageUrl}
            label="Share calculator"
          />
        )}
      </div>

      <HandicapSummary
        result={result}
        targetRating={targetRating}
        onTargetRatingChange={setTargetRating}
      />

      <div className={cardClass}>
        <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-4">
          Add a round
        </h2>
        <RoundEntryForm onSubmit={handleAddRound} />
      </div>

      {loggedIn && loading ? (
        <p className="text-[var(--foreground)]/70 italic text-center py-8">
          Loading your rounds...
        </p>
      ) : (
        <RoundsList
          rounds={rounds}
          countedIndices={result.countedIndices}
          onDelete={handleDeleteRound}
        />
      )}

      {loggedIn ? (
        <SnapshotHistory
          history={history}
          snapshots={snapshots}
          onSave={handleSaveSnapshot}
          saving={saving}
          canSave={result.rating != null}
        />
      ) : (
        status !== 'loading' && (
          <div className={`${cardClass} text-center`}>
            <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-2">
              Save your progress
            </h2>
            <p className="text-[var(--foreground)]/70 mb-4">
              {rounds.length > 0
                ? `Your ${rounds.length} round${rounds.length === 1 ? '' : 's'} are saved in this browser, so signing in won't lose them — we'll offer to move them to your account. Create a free account and DiscNest will recalculate your handicap as you add rounds and chart your progress over time.`
                : 'Create a free account and DiscNest will store your rounds, recalculate your handicap as you add them, and chart your progress over time.'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <GradientButton label="Sign up free" href="/signup" variant="primary" className="px-5 py-2" />
              <GradientButton label="Log in" href="/login" variant="accentGradient" className="px-5 py-2" />
            </div>
          </div>
        )
      )}
    </div>
  );
}
