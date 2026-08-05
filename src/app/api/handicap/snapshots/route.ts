import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import HandicapSnapshot from "@/models/HandicapSnapshot";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { handicapSnapshotSchema } from "@/lib/validation/handicapSchema";
import { recalculateAndSnapshot } from "@/lib/handicap/handicapService";
import type { Session } from "next-auth";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

type SnapshotDoc = {
  _id: { toString(): string };
  rating: number;
  handicapThrows?: number;
  targetRating?: number;
  sampleSize?: number;
  provisional?: boolean;
  trigger?: string;
  note?: string;
  createdAt: Date;
};

// ------------------------------
// GET: snapshot history for the chart
// ------------------------------
const listSnapshotsHandler = async (_req: Request, session: Session) => {
  await connectToDatabase();

  const docs = await HandicapSnapshot.find({ userId: session.user.id })
    .sort({ createdAt: 1 })
    .lean<SnapshotDoc[]>();

  const snapshots = docs.map((doc) => ({
    _id: doc._id.toString(),
    rating: doc.rating,
    handicapThrows: doc.handicapThrows ?? null,
    targetRating: doc.targetRating ?? 1000,
    sampleSize: doc.sampleSize ?? 0,
    provisional: doc.provisional ?? true,
    trigger: doc.trigger ?? "auto",
    note: doc.note,
    createdAt: new Date(doc.createdAt).toISOString(),
  }));

  return NextResponse.json({ snapshots }, { headers: NO_STORE });
};

export const GET = withErrorHandling(
  withUserAuth(listSnapshotsHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/handicap/snapshots"
);

// ------------------------------
// POST: save a snapshot manually
// ------------------------------
const createSnapshotHandler = async (req: Request, session: Session) => {
  await connectToDatabase();

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // An empty body is fine - a manual save needs no fields.
  }

  const parsed = handicapSnapshotSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid snapshot", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { result, snapshotCreated } = await recalculateAndSnapshot(session.user.id, {
    trigger: "manual",
    note: parsed.data.note,
    targetRating: parsed.data.targetRating,
  });

  if (!snapshotCreated) {
    return NextResponse.json(
      { error: "Add at least 3 rounds before saving a snapshot." },
      { status: 400 }
    );
  }

  return NextResponse.json({ handicap: result, snapshotCreated }, { status: 201 });
};

export const POST = withErrorHandling(
  withUserAuth(createSnapshotHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/handicap/snapshots"
);
