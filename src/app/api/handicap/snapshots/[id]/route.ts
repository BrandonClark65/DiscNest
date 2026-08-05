import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import HandicapSnapshot from "@/models/HandicapSnapshot";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import type { Session } from "next-auth";

// ------------------------------
// DELETE: remove a snapshot
// ------------------------------
const deleteSnapshotHandler = async (
  _req: Request,
  session: Session,
  context?: { params?: Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const { id } = context.params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing snapshot ID" }, { status: 400 });
  }

  const doc = await HandicapSnapshot.findById(id);
  if (!doc) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const ownerId =
    typeof doc.userId === "string" ? doc.userId : doc.userId._id.toString();

  if (ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await doc.deleteOne();

  return NextResponse.json({ message: "Snapshot deleted successfully" });
};

export const DELETE = withErrorHandling(
  withUserAuth(deleteSnapshotHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/handicap/snapshots/[id]"
);
