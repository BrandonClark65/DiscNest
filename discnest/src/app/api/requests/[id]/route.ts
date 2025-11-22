import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DiscRequest from "@/models/DiscRequest";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { id } from "zod/v4/locales";

const GET_handler = async (req: Request, { params }: { params: { id: string } }) => {
  await connectToDatabase();
  const { id } = await params;

  const doc = await DiscRequest.findById(id)
    .populate("userId", "_id name")
    .lean();

  if (!doc) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
};

export const GET = withErrorHandling(GET_handler, "/api/requests/[id]");
