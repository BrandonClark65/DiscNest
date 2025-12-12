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

  // Validate with Zod
  const parseResult = editableProfileSchema.safeParse(body);
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
  } = parseResult.data;

  const safeBody = {
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
  };

  await connectToDatabase();

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
