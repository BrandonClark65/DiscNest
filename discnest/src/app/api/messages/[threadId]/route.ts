import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MessageThread from "@/models/MessageThread";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Message } from "@/types/message";
import UserSchema from "@/models/User";
import mongoose from "mongoose";

// GET a single thread
export async function GET(
  req: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await context.params;
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thread = await MessageThread.findById(threadId)
    .populate("participants", "_id name")
    .populate("listingId", "_id title imageUrls")
    .populate("messages.sender", "_id name");

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const userId = session.user.id;
  if (!thread.participants.some((p: any) => p._id.toString() === userId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(thread);
}

// POST append message to existing thread
export async function POST(
  req: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await context.params;
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Missing message content" }, { status: 400 });

  const thread = await MessageThread.findById(threadId);
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  if (!thread.participants.some((p: any) => p.toString() === senderId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Create new message with proper ObjectId references
  const senderObjectId = new mongoose.Types.ObjectId(senderId);
  const newMessage: Partial<Message> = {
    sender: senderObjectId, // store as ObjectId
    content,
    readBy: [senderObjectId],
    timestamp: new Date(),
  };

  // Push message and update updatedAt atomically
  const updatedThread = await MessageThread.findByIdAndUpdate(
    threadId,
    { $push: { messages: newMessage }, $set: { updatedAt: new Date() } },
    { new: true }
  )
    .populate("participants", "_id name")
    .populate("listingId", "_id title imageUrls")
    .populate("messages.sender", "_id name");

  return NextResponse.json(updatedThread);
}

// PUT mark messages as read
export async function PUT(
  req: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await context.params;
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Add userId to readBy for all messages in this thread atomically
  await MessageThread.updateOne(
    { _id: threadId },
    { $addToSet: { "messages.$[].readBy": userId }, $set: { updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
