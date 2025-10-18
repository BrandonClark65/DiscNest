'use server';

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { editableProfileSchema  } from '@/lib/validation/userSchema';
import { withUserAuth } from '@/lib/auth/withUserAuth';

export const POST = withUserAuth(async (req, session) => {
  const body = await req.json();

  // Validate incoming data with Zod
  const parseResult = editableProfileSchema .safeParse(body);
  if (!parseResult.success) {
    console.error("Zod validation error:", parseResult.error.flatten());
    return NextResponse.json(
      { error: 'Invalid data', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  // Extract only allowed fields for update
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
});

export const GET = withUserAuth(async (req, session) => {
  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email }).lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
});
