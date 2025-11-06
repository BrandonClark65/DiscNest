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
// POST: create a new thread
// ----------------------
const createThreadHandler = async (req: Request) => {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const { recipientId, listingId, content } = await req.json();

  if (!recipientId || !listingId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Check for existing thread
  let existing = await MessageThread.findOne({
    participants: { $all: [senderId, recipientId] },
    listingId,
  });

  if (existing) {
    const populatedExisting = (await MessageThread.findById(existing._id)
      .populate("participants", "_id name")
      .populate("listingId", "title imageUrls")
      .populate("messages.sender", "_id name")) as unknown as Thread;

    return NextResponse.json(populatedExisting);
  }

  // Create initial message if provided
  const messages: Message[] = content
    ? [
        {
          sender: new Types.ObjectId(senderId),
          content,
          readBy: [new Types.ObjectId(senderId)],
          timestamp: new Date(),
        },
      ]
    : [];

  // Create new thread
  let thread = await MessageThread.create({
    participants: [
      new Types.ObjectId(senderId),
      new Types.ObjectId(recipientId),
    ],
    listingId: new Types.ObjectId(listingId),
    messages,
    updatedAt: new Date(),
  });

  // Populate before returning
  thread = (await MessageThread.findById(thread._id)
    .populate("participants", "_id name")
    .populate("listingId", "_id title imageUrls")
    .populate("messages.sender", "_id name")) as unknown as Thread;

  return NextResponse.json(thread);
};

export const POST = withErrorHandling(
  createThreadHandler,
  "/api/messages"
);
