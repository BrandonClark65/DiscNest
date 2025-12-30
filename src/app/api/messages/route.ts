import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import MessageThread from "@/models/MessageThread";
import "@/models/Listing";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { sendMessageNotification } from "@/lib/messages/sendMessageNotification";

// ----------------------
// GET: all message threads for current user
// ----------------------
const getThreadsHandler = async () => {
  await connectToDatabase();

  const session = await requireUser();

  const userId = session.user.id;

  const threads = await MessageThread.find({ participants: userId })
    .populate("participants", "_id name")
    .populate("listingId", "title imageUrls")
    .populate("messages.sender", "_id name");

  return NextResponse.json(threads);
};

export const GET = withErrorHandling(
  getThreadsHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/messages"
);

 // ----------------------
// POST: create a new thread (listing OR request)
// ----------------------
const createThreadHandler = async (req: Request) => {
  await connectToDatabase();

  const session = await requireUser();

  const senderId = session.user.id;
  const { recipientId, listingId, requestId, content } = await req.json();

  if (!recipientId)
    return NextResponse.json({ error: "Recipient is required" }, { status: 400 });

  // --- Find existing thread
  // If listingId or requestId is provided, look for thread with that context
  // Otherwise, look for a general conversation thread (no listingId or requestId)
  const threadQuery: Record<string, unknown> = {
    participants: { $all: [senderId, recipientId] },
  };

  if (listingId) {
    threadQuery.listingId = listingId;
  } else if (requestId) {
    threadQuery.requestId = requestId;
  } else {
    // For general conversations, find threads where listingId and requestId are null or don't exist
    threadQuery.$and = [
      { $or: [{ listingId: null }, { listingId: { $exists: false } }] },
      { $or: [{ requestId: null }, { requestId: { $exists: false } }] },
    ];
  }

  const existing = await MessageThread.findOne(threadQuery);

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

  const thread = await MessageThread.create({
    participants: [senderId, recipientId],
    listingId: listingId || undefined,
    requestId: requestId || undefined,
    messages,
  });

  // Use manual population to ensure both participants are returned even if populate filters them
  // This prevents issues where Mongoose populate silently filters out missing documents
  interface PopulatedThread {
    _id: unknown;
    participants: (string | { _id: string; name: string })[];
    listingId?: string | { _id: string; title: string; imageUrls?: string[] };
    requestId?: string | { _id: string; title: string };
    messages?: Array<{
      sender: string | { _id: string; name: string };
      content: string;
      timestamp: Date;
      readBy: string[];
    }>;
  }

  const populatedThread = await MessageThread.findById(thread._id).lean() as PopulatedThread | null;
  
  if (!populatedThread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Manually populate participants to ensure all are included
  const participantIds = populatedThread.participants.map((p) => 
    typeof p === 'string' ? p : p.toString()
  );
  const participants = await User.find({ _id: { $in: participantIds } }, "_id name").lean();
  interface ParticipantDoc {
    _id: unknown;
    name: string;
  }
  const participantMap = new Map<string, ParticipantDoc>(participants.map((p) => [String(p._id), p as unknown as ParticipantDoc]));
  
  populatedThread.participants = populatedThread.participants.map((p) => {
    const id = typeof p === 'string' ? p : String(p);
    return participantMap.get(id) || { _id: id, name: "Unknown" };
  }) as (string | { _id: string; name: string; })[];

  // Populate listingId if it exists
  if (populatedThread.listingId) {
    const Listing = (await import("@/models/Listing")).default;
    const listing = await Listing.findById(populatedThread.listingId, "title imageUrls").lean();
    if (listing) populatedThread.listingId = listing as unknown as { _id: string; title: string; imageUrls?: string[] };
  }

  // Populate requestId if it exists
  if (populatedThread.requestId) {
    const DiscRequest = (await import("@/models/DiscRequest")).default;
    const request = await DiscRequest.findById(populatedThread.requestId, "title").lean();
    if (request) populatedThread.requestId = request as unknown as { _id: string; title: string };
  }

  // Populate message senders
  if (populatedThread.messages && populatedThread.messages.length > 0) {
    const senderIds = populatedThread.messages.map((m) => 
      typeof m.sender === 'string' ? m.sender : String(m.sender)
    );
    const senders = await User.find({ _id: { $in: senderIds } }, "_id name").lean();
    interface SenderDoc {
      _id: unknown;
      name: string;
    }
    const senderMap = new Map<string, SenderDoc>(senders.map((s) => [String(s._id), s as unknown as SenderDoc]));
    
    populatedThread.messages = populatedThread.messages.map((m) => ({
      ...m,
      sender: (senderMap.get(typeof m.sender === 'string' ? m.sender : String(m.sender)) || { _id: String(m.sender), name: "Unknown" }) as unknown as SenderDoc
    })) as { sender: string | { _id: string; name: string; }; content: string; timestamp: Date; readBy: string[]; }[];
  }

  // Send email notification if initial message was created (non-blocking)
  if (content && messages.length > 0) {
    sendMessageNotification(thread._id.toString(), senderId, content).catch((err) => {
      console.error("[createThreadHandler] Email notification error:", err);
    });
  }

  return NextResponse.json(populatedThread);
};


export const POST = withErrorHandling(
  createThreadHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/messages"
);

