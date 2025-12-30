import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Rating from "@/models/Rating";
import { authOptions } from "@/lib/auth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { checkRatingEligibility } from "@/lib/ratings/ratingUtils";
import type { Session } from "next-auth";

// ----------------------
// GET: Get public user info and ratings
// ----------------------
const getPublicUserHandler = async (
  req: Request,
  context: { params: Promise<{ userId: string }> }
) => {
  await connectToDatabase();

  const { userId: identifier } = await context.params;

  // Try to find by username first (if identifier doesn't look like ObjectId)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  
  let userDoc;
  if (isObjectId) {
    userDoc = await User.findById(identifier)
      .select("name username avatarUrl bio averageRating ratingCount")
      .lean();
  }
  
  // If not found by ObjectId, try username
  if (!userDoc) {
    userDoc = await User.findOne({ username: identifier })
      .select("name username avatarUrl bio averageRating ratingCount")
      .lean();
  }

  if (!userDoc) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = userDoc as {
    _id: { toString: () => string } | string;
    name?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    averageRating?: number | null;
    ratingCount?: number;
  };

  const userIdStr = typeof user._id === "string" ? user._id : user._id.toString();

  // Get pagination params
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  // Get ratings for the actual user ID
  const ratings = await Rating.find({ ratedUserId: userIdStr })
    .populate("raterUserId", "name username avatarUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalRatings = await Rating.countDocuments({ ratedUserId: userIdStr });

  // Check if current user can rate this user (if authenticated)
  let canRate = false;
  try {
    const nextAuth = await import("next-auth") as unknown as { 
      getServerSession: (options: typeof authOptions) => Promise<Session | null> 
    };
    const { getServerSession } = nextAuth;
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      const currentUserId = (session.user as { id?: string }).id;
      if (currentUserId && currentUserId !== userIdStr) {
        const eligibility = await checkRatingEligibility(currentUserId, userIdStr);
        canRate = eligibility.eligible;
      }
    }
  } catch (error) {
    // If session check fails, just leave canRate as false
    console.error("Error checking rating eligibility:", error);
  }

  return NextResponse.json({
    user: {
      _id: userIdStr,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      averageRating: user.averageRating ?? null,
      ratingCount: user.ratingCount ?? 0,
    },
    ratings: ratings.map((rating) => {
      const ratingDoc = rating as unknown as {
        _id: { toString: () => string } | string;
        rating: number;
        review?: string;
        createdAt: Date | string;
        raterUserId?: {
          _id: { toString: () => string } | string;
          name?: string;
          username?: string;
          avatarUrl?: string;
        } | { toString: () => string } | string;
      };
      
      const ratingId = typeof ratingDoc._id === "string" ? ratingDoc._id : ratingDoc._id.toString();
      return {
        _id: ratingId,
        rating: ratingDoc.rating,
        review: ratingDoc.review,
        createdAt: ratingDoc.createdAt,
        rater: ratingDoc.raterUserId
          ? {
              _id:
                typeof ratingDoc.raterUserId === "object" && "_id" in ratingDoc.raterUserId
                  ? (typeof ratingDoc.raterUserId._id === "string" 
                      ? ratingDoc.raterUserId._id 
                      : ratingDoc.raterUserId._id.toString())
                  : (typeof ratingDoc.raterUserId === "string"
                      ? ratingDoc.raterUserId
                      : ratingDoc.raterUserId.toString()),
            name:
              typeof ratingDoc.raterUserId === "object" && "name" in ratingDoc.raterUserId
                ? ratingDoc.raterUserId.name
                : undefined,
            username:
              typeof ratingDoc.raterUserId === "object" && "username" in ratingDoc.raterUserId
                ? ratingDoc.raterUserId.username
                : undefined,
            avatarUrl:
              typeof ratingDoc.raterUserId === "object" && "avatarUrl" in ratingDoc.raterUserId
                ? ratingDoc.raterUserId.avatarUrl
                : undefined,
          }
          : null,
      };
    }),
    pagination: {
      page,
      limit,
      total: totalRatings,
      totalPages: Math.ceil(totalRatings / limit),
    },
    canRate,
  });
};

export const GET = withErrorHandling(
  getPublicUserHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/users/[userId]/public"
);

