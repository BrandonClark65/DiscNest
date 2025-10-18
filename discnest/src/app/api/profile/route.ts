'use server';

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { userSchema } from '@/lib/validation/userSchema';
import { withUserAuth } from '@/lib/auth/withUserAuth';

export const POST = withUserAuth(async (req, session) => {
  const body = await req.json();

  // Validate incoming data with Zod
  const parseResult = userSchema.safeParse(body);
  if (!parseResult.success) {
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
    password,
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
    discShelf,
    bag,
    discCount,
  } = parseResult.data;

  const safeBody = {
    name,
    username,
    avatarUrl,
    bio,
    password,
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
    discShelf,
    bag,
    discCount,
  };

  await connectToDatabase();

  const updatedUser = await User.findOneAndUpdate(
    { email: session.user.email },
    { $set: safeBody },
    { new: true }
  ).lean();

  return NextResponse.json({ user: updatedUser });
});
