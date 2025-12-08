import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import User from "@/models/User";
import mongoose from "mongoose";
import { recommendDiscs } from "@/lib/recommendations";
import type { DiscNestUser } from "@/types/user";
import type { Disc } from "@/types/disc";
import type { UserSession } from "@/types/api";

/* ---------- Properly typed Disc model ---------- */
const DiscModel =
  (mongoose.models.Disc as mongoose.Model<Disc>) ||
  mongoose.model<Disc>("Disc", new mongoose.Schema({}), "discs");

/* ---------- Handler ---------- */
const getRecommendationsHandler = async (_req: Request, session: UserSession) => {
  await connectToDatabase();

  // Load user
  const userDoc = await User.findById(session.user.id).lean();
  if (!userDoc) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = userDoc as unknown as DiscNestUser;

  // Load discs
  const bagDiscs = await DiscModel.find({ userId: session.user.id }).lean<Disc[]>();
  const allDiscs = await DiscModel.find().limit(500).lean<Disc[]>();

  // Generate personalized recommendations
  const recs = recommendDiscs(user, bagDiscs, allDiscs);

  return NextResponse.json(recs);
};

/* ---------- Export ---------- */
export const GET = withErrorHandling(
  withUserAuth(getRecommendationsHandler),
  "/api/recommendations"
);
