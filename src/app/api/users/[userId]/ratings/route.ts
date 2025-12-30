import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Rating from "@/models/Rating";
import User from "@/models/User";
import { withErrorHandling } from "@/lib/withErrorHandling";

// ----------------------
// GET: Get user's ratings
// ----------------------
const getRatingsHandler = async (
  req: Request,
  context?: { params?: Promise<{ userId: string }> | Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Handle both Promise (Next.js 15) and direct object (test server)
  const params = context.params instanceof Promise 
    ? await context.params 
    : context.params as { userId: string };
  
  const { userId } = params;

  // Check if user exists
  const user = await User.findById(userId).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get pagination params
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  // Get ratings with pagination
  const ratings = await Rating.find({ ratedUserId: userId })
    .populate("raterUserId", "name username avatarUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalRatings = await Rating.countDocuments({ ratedUserId: userId });

  // Get user's average rating and count
  const userRatingDoc = await User.findById(userId).select("averageRating ratingCount").lean();
  const userRating = userRatingDoc as { averageRating?: number | null; ratingCount?: number } | null;
  const averageRating = userRating?.averageRating ?? null;
  const ratingCount = userRating?.ratingCount ?? 0;

  return NextResponse.json({
    ratings,
    averageRating,
    ratingCount,
    pagination: {
      page,
      limit,
      total: totalRatings,
      totalPages: Math.ceil(totalRatings / limit),
    },
  });
};

export const GET = withErrorHandling(
  getRatingsHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/users/[userId]/ratings"
);

