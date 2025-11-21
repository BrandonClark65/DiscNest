import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MessageThread from "@/models/MessageThread";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Message } from "@/types/message";
import mongoose from "mongoose";
import { withErrorHandling } from "@/lib/withErrorHandling";
import OpenAI from "openai";
import { Filter } from "bad-words";
import User from "@/models/User";
import FlaggedMessage from "@/models/FlaggedMessage";



// Init AI + Local Filter
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const profanityFilter = new Filter();

// ----------------------
// GET: fetch a single thread
// ----------------------
const getThreadHandler = async (
  req: Request,
  context: { params: Promise<{ threadId: string }> }
) => {
  const { threadId } = await context.params;
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thread = await MessageThread.findById(threadId)
    .populate("participants", "_id name")
    .populate("listingId", "_id title imageUrls")
    .populate("requestId", "_id title") 
    .populate("messages.sender", "_id name");


  if (!thread)
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const userId = session.user.id;
  if (!thread.participants.some((p: any) => p._id.toString() === userId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(thread);
};

export const GET = withErrorHandling(
  getThreadHandler,
  "/api/messages/[threadId]"
);

// ----------------------
// POST: append a message
// ----------------------
// ----------------------
// POST: append a message
// ----------------------
const postMessageHandler = async (
  req: Request,
  context: { params: Promise<{ threadId: string }> }
) => {
  const { threadId } = await context.params;
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const { content } = await req.json();

  if (!content)
    return NextResponse.json(
      { error: "Missing message content" },
      { status: 400 }
    );

  const thread = await MessageThread.findById(threadId);
  if (!thread)
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  if (!thread.participants.some((p: any) => p.toString() === senderId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const senderObjectId = new mongoose.Types.ObjectId(senderId);

  // ---------------------------
  // 1. Profanity Filter (local)
  // ---------------------------
  if (profanityFilter.isProfane(content)) {
    // bump moderation flags on user for clear profanity
    await User.findByIdAndUpdate(senderId, {
      $inc: { moderationFlags: 1 },
      $set: { lastFlaggedAt: new Date() },
    });

    // store as flagged message for admin review
    await FlaggedMessage.create({
      sender: senderObjectId,
      threadId,
      content,
      categories: { profanity: true },
    });

    return NextResponse.json(
      {
        error:
          "Your message contains profanity and could not be sent. Please adjust and try again.",
      },
      { status: 400 }
    );
  }

  // --------------------------------------
  // 2. AI Text Moderation (OpenAI Safety)
  // --------------------------------------
  let flagged = false;
  let flaggedCategories: Record<string, boolean> = {};

  try {
    const mod = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: content,
    });

    const result = (mod as any).results[0];
    flagged = result.flagged;
    flaggedCategories = result.categories;

    if (flagged) {
      // Save flagged message for admin review
      await FlaggedMessage.create({
        sender: senderObjectId,
        threadId,
        content,
        categories: flaggedCategories,
      });

      // Increment moderation flags on the user
      await User.findByIdAndUpdate(senderId, {
        $inc: { moderationFlags: 1 },
        $set: { lastFlaggedAt: new Date() },
      });

      return NextResponse.json(
        {
          error:
            "Your message was blocked for inappropriate content. Please modify and try again.",
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Moderation error:", err);
    // Fail-safe: allow message if moderation API fails
  }

  // ---------------------------
  // 3. Construct Message Object (only for allowed messages)
  // ---------------------------
  const newMessage: Partial<Message> = {
    sender: senderObjectId,
    content,
    readBy: [senderObjectId],
    timestamp: new Date(),
    flagged: false,
    flaggedCategories: {}, // all good
  };

  const updatedThread = await MessageThread.findByIdAndUpdate(
    threadId,
    { $push: { messages: newMessage }, $set: { updatedAt: new Date() } },
    { new: true }
  )
    .populate("participants", "_id name")
    .populate("listingId", "_id title imageUrls")
    .populate("requestId", "_id title")     
    .populate("messages.sender", "_id name");


  return NextResponse.json(updatedThread);
};


export const POST = withErrorHandling(
  postMessageHandler,
  "/api/messages/[threadId]"
);

// ----------------------
// PUT: mark messages as read
// ----------------------
const markReadHandler = async (
  req: Request,
  context: { params: Promise<{ threadId: string }> }
) => {
  const { threadId } = await context.params;
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  await MessageThread.updateOne(
    { _id: threadId },
    {
      $addToSet: { "messages.$[].readBy": userId },
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({ success: true });
};

export const PUT = withErrorHandling(
  markReadHandler,
  "/api/messages/[threadId]"
);
