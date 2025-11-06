import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Disc from "@/models/Disc";
import { withErrorHandling } from "@/lib/withErrorHandling";

const handler = async () => {
  await connectToDatabase();

  // Only return catalog discs (not user-owned)
  const discs = await Disc.find(
    { userId: { $exists: false } },
    "name brand type addedAt image stability flight"
  )
    .sort({ addedAt: -1 })
    .lean();

  return NextResponse.json(discs);
};

// ✅ Automatically handles unexpected errors and logs them centrally
export const GET = withErrorHandling(handler, "/api/discs");
