import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { connectToDatabase } from "@/lib/mongodb";

import UserReport from "@/models/UserReport";
import User from "@/models/User";

/**
 * POST /api/report
 * Universal report endpoint supporting:
 * - message reports
 * - thread reports
 * - listing reports
 */
const reportHandler = async (req: Request) => {
  await connectToDatabase();

  const { reportedUserId, threadId, messageId, listingId, reason } =
    await req.json();

  if (!reportedUserId) {
    return NextResponse.json(
      { error: "Missing reportedUserId" },
      { status: 400 }
    );
  }

  // Extract authenticated user from withUserAuth
  const user = (req as any).user;
  if (!user?._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reporterId = user._id.toString();

  if (reporterId === reportedUserId) {
    return NextResponse.json(
      { error: "You cannot report yourself" },
      { status: 400 }
    );
  }

  // Save report
  await UserReport.create({
    reporter: reporterId,
    reportedUser: reportedUserId,
    threadId: threadId || undefined,
    messageId: messageId || undefined,
    listingId: listingId || undefined,
    reason: reason || "",
  });

  // Increment moderation flags on the reported user
  await User.findByIdAndUpdate(reportedUserId, {
    $inc: { moderationFlags: 1 },
    $set: { lastFlaggedAt: new Date() },
  });

  return NextResponse.json({ success: true });
};

export const POST = withErrorHandling(
  withUserAuth(reportHandler),
  "/api/report"
);
