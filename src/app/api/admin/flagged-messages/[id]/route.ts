import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";

import FlaggedMessage from "@/models/FlaggedMessage";
import MessageThread from "@/models/MessageThread";
import User from "@/models/User";

// -----------------------
// CORE LOGIC
// -----------------------
const flaggedMessageAction = async (
  req: Request,
  context?: { params?: { id: string } }
) => {
  const id = context?.params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }
  const { action } = await req.json();

  const flagged = await FlaggedMessage.findById(id);

  if (!flagged) {
    return NextResponse.json({ error: "Flagged message not found" }, { status: 404 });
  }

  // Get admin ID from session (withAdminAuth ensures admin is authenticated)
  const { requireAdmin } = await import("@/lib/auth/requireAdmin");
  const adminSession = await requireAdmin();
  const adminId = adminSession.user.id;

  // -------------------------
  // ACTION: DELIVER
  // -------------------------
  if (action === "deliver") {
    const senderObjectId = new mongoose.Types.ObjectId(flagged.sender);

    await MessageThread.findByIdAndUpdate(
      flagged.threadId,
      {
        $push: {
          messages: {
            sender: senderObjectId,
            content: flagged.content,
            timestamp: new Date(),
            readBy: [],
            flagged: false,
            flaggedCategories: {},
          },
        },
      },
      { new: true }
    );

    flagged.status = "delivered";
    flagged.resolvedAt = new Date();
    flagged.resolvedBy = adminId;
    await flagged.save();

    return NextResponse.json({ success: true });
  }

  // -------------------------
  // ACTION: RESOLVE (allow but don’t deliver)
  // -------------------------
  if (action === "resolve") {
    flagged.status = "resolved";
    flagged.resolvedAt = new Date();
    flagged.resolvedBy = adminId;
    await flagged.save();

    return NextResponse.json({ success: true });
  }

  // -------------------------
  // ACTION: REJECT
  // -------------------------
  if (action === "reject") {
    flagged.status = "rejected";
    flagged.resolvedAt = new Date();
    flagged.resolvedBy = adminId;
    await flagged.save();

    return NextResponse.json({ success: true });
  }

  // -------------------------
  // ACTION: BAN USER
  // -------------------------
  if (action === "ban") {
    await User.findByIdAndUpdate(flagged.sender, {
      $set: { role: "banned" },
    });

    flagged.status = "rejected";
    flagged.resolvedAt = new Date();
    flagged.resolvedBy = adminId;
    await flagged.save();

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
};

// -----------------------
// EXPORT HANDLER WITH AUTH + ERROR HANDLING
// -----------------------
export const POST = withErrorHandling(
  withAdminAuth(flaggedMessageAction),
  "/api/admin/flagged-messages/[id]"
);
