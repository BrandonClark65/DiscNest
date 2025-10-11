import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MessageThread from "@/models/MessageThread";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Thread } from "@/types/thread";

export async function GET(
  req: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await context.params; // ✅ await params
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thread = await MessageThread.findById(threadId)
    .populate("participants", "_id name")
    .populate("listingId", "_id title imageUrls")
    .populate("messages.sender", "_id name")
    .lean() as unknown as Thread;

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  if (!thread.participants.some((p) => p._id.toString() === session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(thread);
}

// POST append message to existing thread
export async function POST(
  req: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await context.params; // ✅ await params
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "Missing message content" }, { status: 400 });
  }

  const thread = await MessageThread.findById(threadId);
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  if (!thread.participants.some((p: any) => p.toString() === senderId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  thread.messages.push({ sender: senderId, content });
  thread.updatedAt = new Date();
  await thread.save();

  return NextResponse.json(thread);
}




