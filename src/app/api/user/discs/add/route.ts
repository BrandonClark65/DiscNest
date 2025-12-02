import { NextResponse } from "next/server";
import User from "@/models/User";
import Disc from "@/models/Disc";
import { connectToDatabase } from "@/lib/mongodb";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { recalcDiscCount } from "@/lib/updateDiscCount";

/* ---------- Handler ---------- */
const addDiscHandler = async (req: Request, session: any) => {
  const { discId, target } = await req.json();

  if (!discId || !target || !["shelf", "bag"].includes(target)) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  // Ensure disc exists in catalog (not user-owned)
  const catalogDisc = await Disc.findOne({
    _id: discId,
    userId: { $exists: false },
  });
  if (!catalogDisc) {
    return NextResponse.json(
      { error: "Disc not found in catalog" },
      { status: 404 }
    );
  }

  // Clone disc for the user
  const discData = catalogDisc.toObject();

  if (!discData.plastic || discData.plastic.trim() === "") {
    discData.plastic = "Unknown";
  }

  const userDisc = new Disc({
    ...discData,
    _id: undefined, // Let MongoDB assign a new ID
    userId: session.user.id,
    addedAt: new Date(),
  });

  await userDisc.save();

  // Add to user’s shelf or bag
  const updateField = target === "shelf" ? "discShelf" : "bag";
  await User.updateOne(
    { _id: session.user.id },
    { $addToSet: { [updateField]: userDisc._id } }
  );

  // ✅ Recalculate disc counts
  await recalcDiscCount(session.user.id);

  return NextResponse.json({ success: true, discId: userDisc._id });
};

/* ---------- Export ---------- */
export const POST = withErrorHandling(
  withUserAuth(addDiscHandler),
  "/api/add-disc"
);
