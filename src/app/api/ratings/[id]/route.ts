import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Rating from "@/models/Rating";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { updateUserRating } from "@/lib/ratings/ratingUtils";
import { RATING_CONFIG } from "@/app/constants/ratingConfig";
import type { Session } from "next-auth";

// ----------------------
// PATCH: Update a rating
// ----------------------
const updateRatingHandler = async (
  req: Request,
  session: Session,
  context?: { params?: Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const { id } = context.params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing rating ID" }, { status: 400 });
  }

  const body = await req.json();
  const { rating, review } = body;

  const ratingDoc = await Rating.findById(id);
  if (!ratingDoc) {
    return NextResponse.json({ error: "Rating not found" }, { status: 404 });
  }

  // Check ownership
  const raterUserId =
    typeof ratingDoc.raterUserId === "string"
      ? ratingDoc.raterUserId
      : ratingDoc.raterUserId._id.toString();

  if (raterUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate rating value if provided
  if (rating !== undefined) {
    if (rating < RATING_CONFIG.MIN_RATING || rating > RATING_CONFIG.MAX_RATING) {
      return NextResponse.json(
        { error: `Rating must be between ${RATING_CONFIG.MIN_RATING} and ${RATING_CONFIG.MAX_RATING}` },
        { status: 400 }
      );
    }
    ratingDoc.rating = rating;
  }

  // Validate review if provided
  if (review !== undefined) {
    if (review.length > RATING_CONFIG.MAX_REVIEW_LENGTH) {
      return NextResponse.json(
        { error: `Review must be ${RATING_CONFIG.MAX_REVIEW_LENGTH} characters or less` },
        { status: 400 }
      );
    }
    ratingDoc.review = review || undefined;
  }

  await ratingDoc.save();

  // Recalculate average rating
  const ratedUserId =
    typeof ratingDoc.ratedUserId === "string"
      ? ratingDoc.ratedUserId
      : ratingDoc.ratedUserId._id.toString();
  await updateUserRating(ratedUserId);

  return NextResponse.json({ rating: ratingDoc });
};

export const PATCH = withErrorHandling(
  withUserAuth(updateRatingHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/ratings/[id]"
);

// ----------------------
// DELETE: Delete a rating
// ----------------------
const deleteRatingHandler = async (
  req: Request,
  session: Session,
  context?: { params?: Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const { id } = context.params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing rating ID" }, { status: 400 });
  }

  const ratingDoc = await Rating.findById(id);
  if (!ratingDoc) {
    return NextResponse.json({ error: "Rating not found" }, { status: 404 });
  }

  // Check ownership
  const raterUserId =
    typeof ratingDoc.raterUserId === "string"
      ? ratingDoc.raterUserId
      : ratingDoc.raterUserId._id.toString();

  if (raterUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get ratedUserId before deleting
  const ratedUserId =
    typeof ratingDoc.ratedUserId === "string"
      ? ratingDoc.ratedUserId
      : ratingDoc.ratedUserId._id.toString();

  await ratingDoc.deleteOne();

  // Recalculate average rating
  await updateUserRating(ratedUserId);

  return NextResponse.json({ message: "Rating deleted successfully" });
};

export const DELETE = withErrorHandling(
  withUserAuth(deleteRatingHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/ratings/[id]"
);

