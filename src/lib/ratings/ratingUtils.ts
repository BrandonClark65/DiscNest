import { connectToDatabase } from "@/lib/mongodb";
import Rating from "@/models/Rating";
import User from "@/models/User";
import Listing from "@/models/Listing";
import MessageThread from "@/models/MessageThread";
import { RATING_CONFIG } from "@/app/constants/ratingConfig";

/**
 * Check if a user is eligible to rate another user
 */
export async function checkRatingEligibility(
  raterUserId: string,
  ratedUserId: string,
  listingId?: string
): Promise<{ eligible: boolean; reason?: string }> {
  await connectToDatabase();

  // Prevent self-rating
  if (raterUserId === ratedUserId) {
    return { eligible: false, reason: "Cannot rate yourself" };
  }

  // If listingId is provided, check if listing exists and is sold
  if (listingId) {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return { eligible: false, reason: "Listing not found" };
    }
    if (!listing.sold) {
      return { eligible: false, reason: "Listing not sold yet" };
    }
  }

  // Find message thread between users for this listing
  const thread = await MessageThread.findOne({
    participants: { $all: [raterUserId, ratedUserId] },
    listingId: listingId || null,
  });

  if (!thread) {
    return { eligible: false, reason: "No conversation found" };
  }

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

  if (messageCount < RATING_CONFIG.MIN_MESSAGES_FOR_RATING) {
    return {
      eligible: false,
      reason: `Need at least ${RATING_CONFIG.MIN_MESSAGES_FOR_RATING} messages`,
    };
  }

  // Check if already rated
  const existingRating = await Rating.findOne({
    raterUserId,
    ratedUserId,
    listingId: listingId || null,
  });

  if (existingRating) {
    return { eligible: false, reason: "Already rated this interaction" };
  }

  return { eligible: true };
}

/**
 * Calculate and update a user's average rating
 */
export async function updateUserRating(userId: string): Promise<void> {
  await connectToDatabase();

  const ratings = await Rating.find({ ratedUserId: userId });

  if (ratings.length === 0) {
    await User.findByIdAndUpdate(userId, {
      averageRating: null,
      ratingCount: 0,
    });
    return;
  }

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / ratings.length;
  const rounded = Math.round(average * 10) / 10; // Round to 1 decimal

  await User.findByIdAndUpdate(
    userId,
    {
      averageRating: rounded,
      ratingCount: ratings.length,
    }
  );
}

