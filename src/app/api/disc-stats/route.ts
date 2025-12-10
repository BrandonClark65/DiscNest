import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Disc from "@/models/Disc";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";

const handler = async () => {
  await connectToDatabase();

  const stats = await Disc.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$addedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return NextResponse.json(
    stats.map((s) => ({ date: s._id, count: s.count }))
  );
};

// ✅ Combines both admin authentication and automatic error logging
export const GET = withAdminAuth(
  withErrorHandling(
    handler as (...args: unknown[]) => Promise<NextResponse>,
    "/api/disc-stats"
  )
);
