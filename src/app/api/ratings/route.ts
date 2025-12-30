import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Rating from "@/models/Rating";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { checkRatingEligibility, updateUserRating } from "@/lib/ratings/ratingUtils";
import { RATING_CONFIG } from "@/app/constants/ratingConfig";
import type { Session } from "next-auth";

// ----------------------
// POST: Create a rating
// ----------------------
const createRatingHandler = async (req: Request, session: Session) => {
  await connectToDatabase();

  const body = await req.json();
  const { ratedUserId, listingId, requestId, rating, review, role } = body;

  // Validation
  if (!ratedUserId || !rating || !role) {
    return NextResponse.json(
      { error: "Missing required fields: ratedUserId, rating, role" },
      { status: 400 }
    );
  }

  if (rating < RATING_CONFIG.MIN_RATING || rating > RATING_CONFIG.MAX_RATING) {
    return NextResponse.json(
      { error: `Rating must be between ${RATING_CONFIG.MIN_RATING} and ${RATING_CONFIG.MAX_RATING}` },
      { status: 400 }
    );
  }

  if (review && review.length > RATING_CONFIG.MAX_REVIEW_LENGTH) {
    return NextResponse.json(
      { error: `Review must be ${RATING_CONFIG.MAX_REVIEW_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  if (!["buyer", "seller"].includes(role)) {
    return NextResponse.json(
      { error: "Role must be 'buyer' or 'seller'" },
      { status: 400 }
    );
  }

  const raterUserId = session.user.id;

  // Prevent self-rating
  if (raterUserId === ratedUserId) {
    return NextResponse.json(
      { error: "Cannot rate yourself" },
      { status: 400 }
    );
  }

  // Check eligibility
  const eligibility = await checkRatingEligibility(
    raterUserId,
    ratedUserId,
    listingId
  );

  if (!eligibility.eligible) {
    return NextResponse.json(
      { error: eligibility.reason || "Not eligible to rate" },
      { status: 400 }
    );
  }

  // Create rating
  const newRating = new Rating({
    raterUserId,
    ratedUserId,
    listingId: listingId || undefined,
    requestId: requestId || undefined,
    rating,
    review: review || undefined,
    role,
  });

  await newRating.save();

  // Update user's average rating
  await updateUserRating(ratedUserId);

  return NextResponse.json({ rating: newRating }, { status: 201 });
};

export const POST = withErrorHandling(
  withUserAuth(createRatingHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/ratings"
);

