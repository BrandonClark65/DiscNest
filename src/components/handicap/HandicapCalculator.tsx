'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import GradientButton from '@/components/ui/GradientButton';
import RoundEntryForm from './RoundEntryForm';
import HandicapSummary from './HandicapSummary';
import RoundsList, { type DisplayRound } from './RoundsList';
import SnapshotHistory, { type Snapshot } from './SnapshotHistory';
import {
  computeHandicap,
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
 * The calculator works fully logged out, holding rounds in local state, and
 * switches to the API once the visitor signs in. Both paths call the same
 * computeHandicap, so the numbers never disagree.
 */
export default function HandicapCalculator() {
  const { data: session, status } = useSession();
  const loggedIn = Boolean(session?.user);

  const [rounds, setRounds] = useState<DisplayRound[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [serverResult, setServerResult] = useState<HandicapResult | null>(null);
  const [targetRating, setTargetRating] = useState(SCRATCH_RATING);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // ---- mutations ---------------------------------------------------------
  const handleAddRound = async (payload: Record<string, unknown>): Promise<boolean> => {
    if (!loggedIn) {
      // Rate it in the browser and keep it in local state only.
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
              Your rounds are only in this browser tab right now. Create a free account
              and DiscNest will store them, recalculate your handicap as you add rounds,
              and chart your progress over time.
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
