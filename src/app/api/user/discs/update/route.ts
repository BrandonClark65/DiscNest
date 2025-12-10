import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Disc from "@/models/Disc";
import type { Disc as DiscType } from "@/types/disc";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import type { Session } from "next-auth";

/* ---------- Handler ---------- */
const updateDiscHandler = async (req: Request, session: Session) => {
  const body = await req.json();
  const { discId, plastic, wearLevel, notes, color, weight } = body;

  if (!discId) {
    return NextResponse.json({ error: "Missing disc ID" }, { status: 400 });
  }

  await connectToDatabase();

  // Ensure user owns this disc
  const disc = await Disc.findById(discId);
  if (!disc || disc.userId.toString() !== session.user.id) {
    return NextResponse.json(
      { error: "Unauthorized or disc not found" },
      { status: 401 }
    );
  }

  const updateFields: Partial<DiscType> = {};

  if (plastic !== undefined) updateFields.plastic = plastic;

  if (wearLevel !== undefined) {
    const wearNumber = Number(wearLevel);
    if (isNaN(wearNumber) || wearNumber < 0 || wearNumber > 100) {
      return NextResponse.json(
        { error: "wearLevel must be a number between 0 and 100" },
        { status: 400 }
      );
    }
    updateFields.wearLevel = wearNumber;
  }

  if (notes !== undefined) updateFields.notes = notes;
  if (color !== undefined) updateFields.color = color;

  if (weight !== undefined && weight !== null && weight !== "") {
    const parsedWeight = Number(weight);
    if (!isNaN(parsedWeight) && parsedWeight >= 100 && parsedWeight <= 200) {
      updateFields.weight = parsedWeight;
    }
  }

  const updatedDisc = await Disc.findByIdAndUpdate(discId, updateFields, {
    new: true,
  });

  return NextResponse.json({ success: true, disc: updatedDisc }, { status: 200 });
};

/* ---------- Export ---------- */
export const POST = withErrorHandling(
  withUserAuth(updateDiscHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/disc/update"
);
