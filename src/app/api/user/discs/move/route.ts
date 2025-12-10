import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { recalcDiscCount } from "@/lib/updateDiscCount";
import type { Session } from "next-auth";

/* ---------- Handler ---------- */
const moveDiscHandler = async (req: Request, session: Session) => {
  const { discId, from, to } = await req.json();

  if (
    !discId ||
    !from ||
    !to ||
    !["discShelf", "bag"].includes(from) ||
    !["discShelf", "bag"].includes(to)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if disc exists in source array
  const existsInSource = user[from]?.some((d: unknown) => {
    const discIdStr = typeof d === 'object' && d !== null && '_id' in d
      ? String(d._id)
      : String(d);
    return discIdStr === discId;
  });
  if (!existsInSource) {
    return NextResponse.json(
      { error: "Disc not found in source" },
      { status: 404 }
    );
  }

  // Move disc: remove from source, add to target
  await User.updateOne(
    { _id: user._id },
    {
      $pull: { [from]: discId },
      $push: { [to]: discId },
    }
  );

  // ✅ Update discCount after modification
  await recalcDiscCount(session.user.id);

  return NextResponse.json({ success: true });
};

/* ---------- Export ---------- */
export const POST = withErrorHandling(
  withUserAuth(moveDiscHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/move-disc"
);
