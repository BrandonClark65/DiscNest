import { NextResponse } from "next/server";
import User from "@/models/User";
import Disc from "@/models/Disc";
import { connectToDatabase } from "@/lib/mongodb";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { recalcDiscCount } from "@/lib/updateDiscCount";
import type { Session } from "next-auth";

/* ---------- Handler ---------- */
const removeDiscHandler = async (req: Request, session: Session) => {
  const { discId, target } = await req.json();

  if (!discId || !target || !["discShelf", "bag"].includes(target)) {
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

  // Remove disc reference from user collection
  await User.updateOne({ _id: user._id }, { $pull: { [target]: discId } });

  // Delete the disc document owned by this user
  await Disc.deleteOne({ _id: discId, userId: user._id });

  // ✅ Update disc count for profile stats
  await recalcDiscCount(session.user.id);

  return NextResponse.json({ success: true });
};

/* ---------- Export ---------- */
export const POST = withErrorHandling(
  withUserAuth(removeDiscHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/remove-disc"
);
