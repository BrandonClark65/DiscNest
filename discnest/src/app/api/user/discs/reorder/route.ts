import { NextResponse } from "next/server";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import User from "@/models/User";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

/* ---------- Handler ---------- */
const reorderDiscsHandler = async (req: Request, session: any) => {
  await connectToDatabase();

  const { orderedIds, zone } = await req.json();

  if (!Array.isArray(orderedIds) || !zone) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!["bag", "shelf"].includes(zone)) {
    return NextResponse.json({ error: "Invalid zone value" }, { status: 400 });
  }

  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Convert to ObjectIds for valid Mongo references
  const orderedObjectIds = orderedIds.map(
    (id: string) => new mongoose.Types.ObjectId(id)
  );

  if (zone === "bag") {
    user.bag = orderedObjectIds;
  } else {
    user.discShelf = orderedObjectIds;
  }

  await user.save();

  return NextResponse.json({ success: true });
};

/* ---------- Export ---------- */
export const POST = withErrorHandling(
  withUserAuth(reorderDiscsHandler),
  "/api/reorder-discs"
);
