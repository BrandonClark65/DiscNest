import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MessageThread from "@/models/MessageThread";
import "@/models/Listing"; 
import { connectToDatabase } from "@/lib/mongodb";
import type { Thread } from "@/types/thread";
import type { Message } from "@/types/message";
import { Types } from "mongoose";

// GET all threads for current user
export async function GET(req: Request) {
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
}

// POST create new thread
export async function POST(req: Request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const { recipientId, listingId, content } = await req.json();

  if (!recipientId || !listingId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Check if thread already exists
  let existing = await MessageThread.findOne({
    participants: { $all: [senderId, recipientId] },
    listingId,
  });

  if (existing) {
    const populatedExisting = await MessageThread.findById(existing._id)
      .populate("participants", "_id name")
      .populate("listingId", "title imageUrls")
      .populate("messages.sender", "_id name") as unknown as Thread;

    return NextResponse.json(populatedExisting);
  }


  // Initialize messages array as ObjectIds
  const messages: Message[] = content
    ? [
        {
          sender: new Types.ObjectId(senderId), // ObjectId
          content,
          readBy: [new Types.ObjectId(senderId)], // ObjectId array
          timestamp: new Date(),
        },
      ]
    : [];

  // Create new thread
  let thread = await MessageThread.create({
    participants: [new Types.ObjectId(senderId), new Types.ObjectId(recipientId)],
    listingId: new Types.ObjectId(listingId),
    messages,
    updatedAt: new Date(),
  });

  // Populate thread before returning
  thread = await MessageThread.findById(thread._id)
    .populate("participants", "_id name")
    .populate("listingId", "_id title imageUrls")
    .populate("messages.sender", "_id name") as unknown as Thread;

  return NextResponse.json(thread);
}
