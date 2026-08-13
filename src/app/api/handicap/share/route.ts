import { NextResponse } from "next/server";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";
import type { Session } from "next-auth";

/**
 * POST /api/handicap/share
 *
 * Ensures the logged-in user has a stable, unguessable shareableHandicapId and
 * returns the share URL for it. Mirrors /api/user/discs/share — the id is
 * created once and reused, so a link someone already sent keeps working.
 */
const shareHandicapHandler = async (req: Request, session: Session) => {
  await connectToDatabase();

  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Another account holding this uuid is vanishingly unlikely, but a collision
  // would leak one player's rounds to the other's link, so check for it.
  let existingConflict = null;
  if (user.shareableHandicapId) {
    existingConflict = await User.findOne({
      shareableHandicapId: user.shareableHandicapId,
      _id: { $ne: user._id },
    }).select("_id");
  }

  if (!user.shareableHandicapId || existingConflict) {
    user.shareableHandicapId = uuidv4();
    await user.save();
  }

  // Prefer the requesting origin so the link works on localhost too.
  const originHeader = req.headers.get("origin");
  const baseUrl = originHeader?.startsWith("http")
    ? originHeader
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return NextResponse.json({
    shareUrl: `${baseUrl}/share/handicap/${user.shareableHandicapId}`,
    shareableHandicapId: user.shareableHandicapId,
  });
};

export const POST = withErrorHandling(
  withUserAuth(shareHandicapHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/handicap/share"
);
