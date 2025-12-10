import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DiscRequest from "@/models/DiscRequest";
import { withErrorHandling } from "@/lib/withErrorHandling";

const GET_handler = async (req: Request, { params }: { params: { id: string } }) => {
  await connectToDatabase();
  const { id } = await params;

  const doc = await DiscRequest.findById(id)
    .populate({
      path: "userId",
      select: "name avatarUrl username"
    })
    .lean();

  if (!doc) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
};

export const GET = withErrorHandling(
  GET_handler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/requests/[id]"
);
