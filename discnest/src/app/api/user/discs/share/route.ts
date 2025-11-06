import { NextResponse } from "next/server";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/user/discs/share
 *
 * Ensures the logged-in user has a unique, stable shareableBagId
 * and returns the correct share URL (dev or prod).
 * Does NOT toggle visibility — this simply guarantees the share link exists.
 */
const shareBagHandler = async (req: Request, session: any) => {
  await connectToDatabase();

  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // ✅ Check if another user already uses this UUID (rare, but possible)
  let existingConflict = null;
  if (user.shareableBagId) {
    existingConflict = await User.findOne({
      shareableBagId: user.shareableBagId,
      _id: { $ne: user._id },
    }).select("_id");
  }

  // ✅ Generate a new UUID if missing or conflicting
  if (!user.shareableBagId || existingConflict) {
    user.shareableBagId = uuidv4();
    await user.save();
  }

  // ✅ Auto-detect base URL (supports localhost and production)
  const originHeader = req.headers.get("origin");
  const baseUrl =
    originHeader?.startsWith("http")
      ? originHeader
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // ✅ Construct share URL
  const shareUrl = `${baseUrl}/share/bag/${user.shareableBagId}`;

  return NextResponse.json({
    shareUrl,
    shareableBagId: user.shareableBagId,
    environment: process.env.NODE_ENV,
  });
};

/* ---------- Export ---------- */
export const POST = withErrorHandling(
  withUserAuth(shareBagHandler),
  "/api/user/discs/share"
);
