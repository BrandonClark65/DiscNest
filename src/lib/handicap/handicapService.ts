import { connectToDatabase } from "@/lib/mongodb";
import HandicapRound from "@/models/HandicapRound";
import HandicapSnapshot from "@/models/HandicapSnapshot";
import { computeHandicap, type ScoredRound, type HandicapResult } from "./handicapUtils";
import { ROUND_WINDOW, SCRATCH_RATING, PTS_PER_THROW_STD } from "@/app/constants/handicapConfig";

/** A round as it comes back from Mongo, serialized for the client. */
export interface SerializedRound {
  _id: string;
  source: string;
  courseName?: string;
  layoutName?: string;
  date: string;
  holes: number;
  score?: number;
  par?: number;
  ssa?: number;
  providedRating?: number;
  computedRating: number;
  estimated: boolean;
  roundType: string;
  completed: boolean;
  notes?: string;
}

type RoundDoc = {
  _id: { toString(): string };
  source: string;
  courseName?: string;
  layoutName?: string;
  date: Date;
  holes?: number;
  score?: number;
  par?: number;
  ssa?: number;
  providedRating?: number;
  computedRating: number;
  estimated?: boolean;
  roundType?: string;
  completed?: boolean;
  notes?: string;
};

/** There is no shared serializer in this codebase, so each layer maps its own. */
export function serializeRound(doc: RoundDoc): SerializedRound {
  return {
    _id: doc._id.toString(),
    source: doc.source,
    courseName: doc.courseName,
    layoutName: doc.layoutName,
    date: new Date(doc.date).toISOString(),
    holes: doc.holes ?? 18,
    score: doc.score,
    par: doc.par,
    ssa: doc.ssa,
    providedRating: doc.providedRating,
    computedRating: doc.computedRating,
    estimated: doc.estimated ?? false,
    roundType: doc.roundType ?? "casual",
    completed: doc.completed ?? true,
    notes: doc.notes,
  };
}

/**
 * The player's highest rating over the trailing 365 days, which the WHS soft
 * and hard caps are measured against. Null when there is no history yet.
 */
async function getHighRating365(userId: string): Promise<number | null> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);

  const best = await HandicapSnapshot.findOne({
    userId,
    createdAt: { $gte: cutoff },
  })
    .sort({ rating: -1 })
    .lean<{ rating: number } | null>();

  return best?.rating ?? null;
}

/**
 * Load a user's completed rounds, newest first, capped at the rating window.
 * DNF rounds are excluded entirely, matching PDGA.
 */
export async function getRatedRounds(userId: string): Promise<SerializedRound[]> {
  await connectToDatabase();
  const docs = await HandicapRound.find({ userId, completed: true })
    .sort({ date: -1 })
    .limit(ROUND_WINDOW)
    .lean<RoundDoc[]>();
  return docs.map(serializeRound);
}

/** Every round the user has entered, for the rounds table (not just the window). */
export async function getAllRounds(userId: string): Promise<SerializedRound[]> {
  await connectToDatabase();
  const docs = await HandicapRound.find({ userId })
    .sort({ date: -1 })
    .lean<RoundDoc[]>();
  return docs.map(serializeRound);
}

/** Run the calculator over a user's stored rounds. */
export async function calculateForUser(
  userId: string,
  targetRating: number = SCRATCH_RATING
): Promise<{ result: HandicapResult; rounds: SerializedRound[] }> {
  await connectToDatabase();

  const rounds = await getRatedRounds(userId);
  const scored: ScoredRound[] = rounds.map((r) => ({
    rating: r.computedRating,
    date: r.date,
    holes: r.holes,
    estimated: r.estimated,
  }));

  const result = computeHandicap(scored, {
    targetRating,
    ppt: PTS_PER_THROW_STD,
    highRating365: await getHighRating365(userId),
  });

  return { result, rounds };
}

/**
 * Recompute a user's handicap and record a snapshot.
 *
 * Auto snapshots are written only when the rating actually moved, so adding a
 * round that changes nothing does not clutter the progress chart. Manual saves
 * always write. Every mutating route funnels through here so the rule lives in
 * exactly one place.
 */
export async function recalculateAndSnapshot(
  userId: string,
  options: { trigger?: "manual" | "auto"; note?: string; targetRating?: number } = {}
): Promise<{ result: HandicapResult; snapshotCreated: boolean }> {
  await connectToDatabase();

  const trigger = options.trigger ?? "auto";
  const targetRating = options.targetRating ?? SCRATCH_RATING;
  const { result } = await calculateForUser(userId, targetRating);

  // Nothing to record until the player clears the minimum round count.
  if (result.rating == null) {
    return { result, snapshotCreated: false };
  }

  if (trigger === "auto") {
    const latest = await HandicapSnapshot.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean<{ rating: number } | null>();

    if (latest && latest.rating === result.rating) {
      return { result, snapshotCreated: false };
    }
  }

  await HandicapSnapshot.create({
    userId,
    rating: result.rating,
    handicapThrows: result.handicapThrows,
    targetRating: result.targetRating,
    sampleSize: result.sampleSize,
    provisional: result.provisional,
    trigger,
    note: options.note,
  });

  return { result, snapshotCreated: true };
}
