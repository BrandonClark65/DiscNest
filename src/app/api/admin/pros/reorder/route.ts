import { NextResponse } from "next/server";
import ProPlayer from "@/models/ProPlayer";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * POST /api/admin/pros/reorder
 * Body: { ids: string[] }  (every pro id, in the desired order)
 *
 * Assigns displayOrder = 0, 1, 2, ... across the given ids in one write. This
 * is the reliable alternative to swapping two rows' displayOrder, which broke
 * whenever adjacent pros happened to share a value.
 */
const reorderHandler = async (req: Request) => {
  await connectToDatabase();
  const body = await req.json().catch(() => ({}));
  const ids: unknown = body.ids;
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== "string") || ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array of strings" }, { status: 400 });
  }

  await ProPlayer.bulkWrite(
    (ids as string[]).map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { displayOrder: index } } },
    }))
  );

  return NextResponse.json({ ok: true, count: ids.length });
};

export const POST = withAdminAuth(
  withErrorHandling(
    reorderHandler as (...args: unknown[]) => Promise<NextResponse>,
    "/api/admin/pros/reorder"
  )
);
