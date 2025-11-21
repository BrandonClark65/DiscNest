import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MessageThread from "@/models/MessageThread";
import "@/models/Listing";
import { connectToDatabase } from "@/lib/mongodb";
import type { Thread } from "@/types/thread";
import type { Message } from "@/types/message";
import { Types } from "mongoose";
import { withErrorHandling } from "@/lib/withErrorHandling";

// ----------------------
// GET: all message threads for current user
// ----------------------
const getThreadsHandler = async (req: Request) => {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const threads = await MessageThread.find({ participants: userId })
    .populate("participants", "_id name")
    .populate("listingId", "title imageUrls")
    .populate("messages.sender", "_id name");

  return NextResponse.json(threads);
};

export const GET = withErrorHandling(getThreadsHandler, "/api/messages");

 // ----------------------
// POST: create a new thread (listing OR request)
// ----------------------
const createThreadHandler = async (req: Request) => {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const { recipientId, listingId, requestId, content } = await req.json();

  if (!recipientId)
    return NextResponse.json({ error: "Recipient is required" }, { status: 400 });

  if (!listingId && !requestId)
    return NextResponse.json(
      { error: "Either listingId or requestId is required" },
      { status: 400 }
    );

  // --- Find existing thread
  let existing = await MessageThread.findOne({
    participants: { $all: [senderId, recipientId] },
    ...(listingId ? { listingId } : {}),
    ...(requestId ? { requestId } : {}),
  });

  if (existing) {
    const populated = await MessageThread.findById(existing._id)
      .populate("participants", "_id name")
      .populate("listingId", "title imageUrls")
      .populate("requestId", "title")
      .populate("messages.sender", "_id name");

    return NextResponse.json(populated);
  }

  // --- Create new thread
  const messages = content
    ? [
        {
          sender: senderId,
          content,
          readBy: [senderId],
        },
      ]
    : [];

  let thread = await MessageThread.create({
    participants: [senderId, recipientId],
    listingId: listingId || undefined,
    requestId: requestId || undefined,
    messages,
  });

  thread = await MessageThread.findById(thread._id)
    .populate("participants", "_id name")
    .populate("listingId", "title imageUrls")
    .populate("requestId", "title")
    .populate("messages.sender", "_id name");

  return NextResponse.json(thread);
};


export const POST = withErrorHandling(createThreadHandler, "/api/messages");

