import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adjust path to your NextAuth config
import MessageThread from "@/models/MessageThread";
import { connectToDatabase } from "@/lib/mongodb";

// GET all threads for current user
export async function GET(req: Request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const threads = await MessageThread.find({ participants: userId })
    .populate("listingId", "title imageUrls")
    .populate("participants", "name");

  return NextResponse.json(threads);
}

// POST new message (creates thread if needed)
export async function POST(req: Request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const { recipientId, listingId, content } = await req.json();

  if (!recipientId || !listingId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Find existing thread between these two users for this listing
  let thread = await MessageThread.findOne({
    participants: { $all: [senderId, recipientId] },
    listingId,
  });

  if (!thread) {
    // Create new thread
    thread = await MessageThread.create({
      participants: [senderId, recipientId],
      listingId,
      messages: content
        ? [{ sender: senderId, content }]
        : [], // no message yet if just starting
    });
  } else if (content) {
    // Append message if provided
    thread.messages.push({ sender: senderId, content });
    thread.updatedAt = new Date();
    await thread.save();
  }

  return NextResponse.json(thread);
}

