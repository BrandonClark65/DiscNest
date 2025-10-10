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

// POST new thread
export async function POST(req: Request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const { recipientId, listingId, content } = await req.json();

  if (!recipientId || !listingId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await MessageThread.findOne({
    participants: { $all: [senderId, recipientId] },
    listingId,
  });

  if (existing) return NextResponse.json(existing);

  const thread = await MessageThread.create({
    participants: [senderId, recipientId],
    listingId,
    messages: content ? [{ sender: senderId, content }] : [],
  });

  return NextResponse.json(thread);
}


