import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { userSchema } from "@/lib/validation/userSchema";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Validate incoming data with Zod
  const parseResult = userSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parseResult.error.flatten() },
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
}
