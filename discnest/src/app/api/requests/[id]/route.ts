// src/app/api/requests/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DiscRequest from "@/models/DiscRequest";
import { withErrorHandling } from "@/lib/withErrorHandling";

type Params = {
  params: { id: string };
};

const GET_handler = async (_req: Request, { params }: Params) => {
  await connectToDatabase();

  const request = await DiscRequest.findById(params.id)
    .populate("userId", "name image")
    .lean();

  if (!request) {
    return NextResponse.json(
      { error: "Disc request not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(request);
};

export const GET = withErrorHandling(GET_handler, "/api/requests/[id]");
