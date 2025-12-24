"use server";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { editableProfileSchema } from "@/lib/validation/userSchema";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";

// ----------------------
// POST: update profile
// ----------------------
import type { Session } from "next-auth";

const updateProfileHandler = async (req: Request, session: Session) => {
  const body = await req.json();

  // Extract role separately (not in editableProfileSchema)
  const { role, ...bodyWithoutRole } = body;

  // Validate with Zod
  const parseResult = editableProfileSchema.safeParse(bodyWithoutRole);
  if (!parseResult.success) {
    console.error("Zod validation error:", parseResult.error.flatten());
    return NextResponse.json(
      { error: "Invalid data", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const {
    name,
    username,
    avatarUrl,
    bio,
    location,
    pdgaNumber,
    homeCourse,
    favoriteCourses,
    maxDistanceFt,
    goals,
    dominantHand,
    throwStyle,
    favoriteBrands,
    preferredDiscTypes,
    stabilityPreference,
    armSpeed,
    skillLevel,
    playFrequency,
    preferredPlastics,
    storeName,
  } = parseResult.data;

  await connectToDatabase();

  // Normalize storeName to lowercase and validate uniqueness if provided
  const normalizedStoreName = storeName?.toLowerCase().trim();
  if (normalizedStoreName) {
    // Check if another user already has this storeName
    const existingStore = await User.findOne({ 
      storeName: normalizedStoreName,
      _id: { $ne: session.user.id }
    });
    if (existingStore) {
      return NextResponse.json(
        { error: "Store name already taken" },
        { status: 400 }
      );
    }
  }

  const safeBody: {
    name?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    location?: { type: string; coordinates: [number, number] };
    pdgaNumber?: number;
    homeCourse?: string;
    favoriteCourses?: string[];
    maxDistanceFt?: number;
    goals?: string;
    dominantHand?: string;
    throwStyle?: string;
    favoriteBrands?: string[];
    preferredDiscTypes?: string[];
    stabilityPreference?: string;
    armSpeed?: string;
    skillLevel?: string;
    playFrequency?: string;
    preferredPlastics?: string[];
    storeName?: string;
    role?: string;
  } = {
    name,
    username,
    avatarUrl,
    bio,
    location,
    pdgaNumber,
    homeCourse,
    favoriteCourses,
    maxDistanceFt,
    goals,
    dominantHand,
    throwStyle,
    favoriteBrands,
    preferredDiscTypes,
    stabilityPreference,
    armSpeed,
    skillLevel,
    playFrequency,
    preferredPlastics,
    storeName: normalizedStoreName || undefined,
  };

  // Only update role if provided and valid
  if (role === 'user' || role === 'store') {
    safeBody.role = role;
  }

  const updatedUser = await User.findOneAndUpdate(
    { email: session.user.email },
    { $set: safeBody },
    { new: true }
  ).lean();

  return NextResponse.json({ user: updatedUser });
};

export const POST = withErrorHandling(
  withUserAuth(updateProfileHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/profile"
);

// ----------------------
// GET: fetch current user profile
// ----------------------
const getProfileHandler = async (req: Request, session: Session) => {
  await connectToDatabase();

  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent caching to ensure fresh data (especially for avatar updates)
  return NextResponse.json(
    { user },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
};

export const GET = withErrorHandling(
  withUserAuth(getProfileHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/profile"
);
