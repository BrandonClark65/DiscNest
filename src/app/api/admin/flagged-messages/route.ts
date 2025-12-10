import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { connectToDatabase } from "@/lib/mongodb";
import FlaggedMessage from "@/models/FlaggedMessage";

const getFlaggedMessages = async () => {
  await connectToDatabase();

  const messages = await FlaggedMessage.find({ status: "pending" })
    .populate("sender", "name email moderationFlags")
    .populate("threadId", "listingId")
    .sort({ createdAt: -1 });

  return NextResponse.json(messages);
};

export const GET = withAdminAuth(
  withErrorHandling(
    getFlaggedMessages as (...args: unknown[]) => Promise<NextResponse>,
    "/api/admin/flagged-messages"
  )
);
