import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";

export const GET = withAdminAuth(async () => {
  await connectToDatabase();

  const users = await User.find({}, "name email role createdAt lastLogin").lean();

  return NextResponse.json({ users });
});
