import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import HandicapRound from "@/models/HandicapRound";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { handicapRoundSchema } from "@/lib/validation/handicapSchema";
import { roundRating } from "@/lib/handicap/handicapUtils";
import {
  recalculateAndSnapshot,
  calculateForUser,
  getAllRounds,
  serializeRound,
} from "@/lib/handicap/handicapService";
import type { Session } from "next-auth";

// Per-user data must never be cached at the edge
const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

// ------------------------------
// GET: this user's rounds + handicap
// ------------------------------
const listRoundsHandler = async (_req: Request, session: Session) => {
  await connectToDatabase();

  // Read-only on purpose: a GET must not write a snapshot. Snapshots are
  // written by the mutating routes, which is where the rating can change.
  const rounds = await getAllRounds(session.user.id);
  const { result } = await calculateForUser(session.user.id);

  return NextResponse.json({ rounds, handicap: result }, { headers: NO_STORE });
};

export const GET = withErrorHandling(
  withUserAuth(listRoundsHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/handicap/rounds"
);

// ------------------------------
// POST: add a round
// ------------------------------
const createRoundHandler = async (req: Request, session: Session) => {
  await connectToDatabase();

  const body = await req.json();

  const parsed = handicapRoundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid round", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // The rating is always derived server-side so a client cannot post an
  // arbitrary computedRating and inflate their own handicap.
  let rated;
  try {
    rated = roundRating({
      source: data.source,
      holes: data.holes,
      score: "score" in data ? data.score : undefined,
      ssa: "ssa" in data ? data.ssa : undefined,
      par: "par" in data ? data.par : undefined,
      providedRating: "providedRating" in data ? data.providedRating : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not rate this round" },
      { status: 400 }
    );
  }

  const round = await HandicapRound.create({
    userId: session.user.id,
    source: data.source,
    courseName: data.courseName,
    layoutName: data.layoutName,
    date: data.date,
    holes: data.holes,
    score: "score" in data ? data.score : undefined,
    ssa: "ssa" in data ? data.ssa : undefined,
    par: "par" in data ? data.par : undefined,
    providedRating: "providedRating" in data ? data.providedRating : undefined,
    computedRating: rated.rating,
    estimated: rated.estimated,
    roundType: data.roundType,
    completed: data.completed,
    notes: data.notes,
  });

  const { result, snapshotCreated } = await recalculateAndSnapshot(session.user.id, {
    trigger: "auto",
  });

  return NextResponse.json(
    { round: serializeRound(round.toObject()), handicap: result, snapshotCreated },
    { status: 201 }
  );
};

export const POST = withErrorHandling(
  withUserAuth(createRoundHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/handicap/rounds"
);
