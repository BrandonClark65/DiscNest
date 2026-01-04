import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Listing from "@/models/Listing";
import MessageThread from "@/models/MessageThread";
import Rating from "@/models/Rating";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { RATING_CONFIG } from "@/app/constants/ratingConfig";
import type { Session } from "next-auth";

// ----------------------
// GET: Check if user can rate another user
// ----------------------
const checkEligibilityHandler = async (
  req: Request,
  session: Session,
  context?: { params?: Promise<{ userId: string }> | Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Handle both Promise (Next.js 15) and direct object (test server)
  const params = context.params instanceof Promise 
    ? await context.params 
    : context.params as { userId: string | unknown };
  
  // Safely extract and convert userId to string
  const userIdRaw = params.userId;
  let userId: string;
  
  if (typeof userIdRaw === "string" && userIdRaw !== "[object Object]") {
    userId = userIdRaw;
  } else if (userIdRaw && typeof userIdRaw === "object" && "toString" in userIdRaw) {
    userId = (userIdRaw as { toString: () => string }).toString();
  } else {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // Ensure userId is a valid MongoDB ObjectId format (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
  }

  // Safely extract and convert raterUserId to string
  const raterUserIdRaw = session.user.id;
  let raterUserId: string;
  
  if (typeof raterUserIdRaw === "string") {
    raterUserId = raterUserIdRaw;
  } else if (raterUserIdRaw && typeof raterUserIdRaw === "object" && "toString" in raterUserIdRaw) {
    raterUserId = (raterUserIdRaw as { toString: () => string }).toString();
  } else {
    return NextResponse.json({ error: "Invalid rater user ID" }, { status: 400 });
  }

  // Ensure raterUserId is a valid MongoDB ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(raterUserId)) {
    return NextResponse.json({ error: "Invalid rater user ID format" }, { status: 400 });
  }

  // Prevent self-rating
  if (raterUserId === userId) {
    return NextResponse.json({
      eligible: false,
      interactions: [],
      reason: "Cannot rate yourself",
    });
  }

  // Find all message threads between the two users
  const threads = await MessageThread.find({
    participants: { $all: [raterUserId, userId] },
  }).lean();

  const interactions: Array<{
    listingId?: string;
    requestId?: string;
    eligible: boolean;
    reason?: string;
    messageCount: number;
    listingSold?: boolean;
  }> = [];

  for (const thread of threads) {
    const listingId = thread.listingId?.toString();
    const requestId = thread.requestId?.toString();

    // Count messages (excluding system messages)
    // System messages use ObjectId("000000000000000000000000") as sender
    const SYSTEM_SENDER_ID = "000000000000000000000000";
    const messageCount = thread.messages.filter((msg: { sender?: unknown }) => {
      if (!msg.sender) return false;
      const senderId =
        typeof msg.sender === "string"
          ? msg.sender
          : msg.sender.toString();
      return senderId !== SYSTEM_SENDER_ID;
    }).length;

    let listingSold = false;
    if (listingId) {
      const listingDoc = await Listing.findById(listingId).lean();
      const listing = listingDoc as { sold?: boolean } | null;
      listingSold = listing?.sold || false;
    }

    // Check if already rated
    const existingRating = await Rating.findOne({
      raterUserId,
      ratedUserId: userId,
      listingId: listingId || null,
    });

    const eligible =
      messageCount >= RATING_CONFIG.MIN_MESSAGES_FOR_RATING &&
      (listingId ? listingSold : true) &&
      !existingRating;

    interactions.push({
      listingId,
      requestId,
      eligible,
      messageCount,
      listingSold: listingId ? listingSold : undefined,
      reason: existingRating
        ? "Already rated"
        : messageCount < RATING_CONFIG.MIN_MESSAGES_FOR_RATING
        ? `Need at least ${RATING_CONFIG.MIN_MESSAGES_FOR_RATING} messages`
        : listingId && !listingSold
        ? "Listing not sold yet"
        : undefined,
    });
  }

  const eligibleInteractions = interactions.filter((i) => i.eligible);

  return NextResponse.json({
    eligible: eligibleInteractions.length > 0,
    interactions,
  });
};

export const GET = withErrorHandling(
  withUserAuth(checkEligibilityHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/ratings/eligibility/[userId]"
);

