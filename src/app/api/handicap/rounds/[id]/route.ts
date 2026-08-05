import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import HandicapRound from "@/models/HandicapRound";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { handicapRoundUpdateSchema } from "@/lib/validation/handicapSchema";
import { roundRating } from "@/lib/handicap/handicapUtils";
import { recalculateAndSnapshot, serializeRound } from "@/lib/handicap/handicapService";
import type { Session } from "next-auth";

/**
 * The model is exported untyped (`models.X || model(...)`), so the document
 * shape is spelled out here rather than inferred - otherwise it collapses to
 * `{}` and every field assignment below fails to typecheck.
 */
interface HandicapRoundDoc {
  userId: string | { _id: { toString(): string } };
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
  estimated: boolean;
  roundType?: string;
  completed?: boolean;
  notes?: string;
  save(): Promise<unknown>;
  deleteOne(): Promise<unknown>;
  toObject(): Parameters<typeof serializeRound>[0];
}

/** Shared lookup + ownership guard for both verbs. */
async function loadOwnedRound(
  id: unknown,
  session: Session
): Promise<{ error: NextResponse } | { doc: HandicapRoundDoc }> {
  if (!id || typeof id !== "string") {
    return { error: NextResponse.json({ error: "Missing round ID" }, { status: 400 }) };
  }

  const doc = (await HandicapRound.findById(id)) as HandicapRoundDoc | null;
  if (!doc) {
    return { error: NextResponse.json({ error: "Round not found" }, { status: 404 }) };
  }

  const ownerId =
    typeof doc.userId === "string" ? doc.userId : doc.userId._id.toString();

  if (ownerId !== session.user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { doc };
}

// ------------------------------
// PATCH: replace a round
// ------------------------------
const updateRoundHandler = async (
  req: Request,
  session: Session,
  context?: { params?: Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const loaded = await loadOwnedRound(context.params.id, session);
  if ("error" in loaded) return loaded.error;
  const { doc } = loaded;

  const body = await req.json();
  const parsed = handicapRoundUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid round", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

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

  doc.source = data.source;
  doc.courseName = data.courseName;
  doc.layoutName = data.layoutName;
  doc.date = data.date;
  doc.holes = data.holes;
  // Clear the fields that do not belong to the new source, so a round edited
  // from "score + par" to "PDGA rating" does not keep a stale par.
  doc.score = "score" in data ? data.score : undefined;
  doc.ssa = "ssa" in data ? data.ssa : undefined;
  doc.par = "par" in data ? data.par : undefined;
  doc.providedRating = "providedRating" in data ? data.providedRating : undefined;
  doc.computedRating = rated.rating;
  doc.estimated = rated.estimated;
  doc.roundType = data.roundType;
  doc.completed = data.completed;
  doc.notes = data.notes;

  await doc.save();

  const { result, snapshotCreated } = await recalculateAndSnapshot(session.user.id, {
    trigger: "auto",
  });

  return NextResponse.json({
    round: serializeRound(doc.toObject()),
    handicap: result,
    snapshotCreated,
  });
};

export const PATCH = withErrorHandling(
  withUserAuth(updateRoundHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/handicap/rounds/[id]"
);

// ------------------------------
// DELETE: remove a round
// ------------------------------
const deleteRoundHandler = async (
  _req: Request,
  session: Session,
  context?: { params?: Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const loaded = await loadOwnedRound(context.params.id, session);
  if ("error" in loaded) return loaded.error;

  await loaded.doc.deleteOne();

  const { result, snapshotCreated } = await recalculateAndSnapshot(session.user.id, {
    trigger: "auto",
  });

  return NextResponse.json({
    message: "Round deleted successfully",
    handicap: result,
    snapshotCreated,
  });
};

export const DELETE = withErrorHandling(
  withUserAuth(deleteRoundHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/handicap/rounds/[id]"
);
