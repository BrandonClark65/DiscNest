import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DiscRequest from "@/models/DiscRequest";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { addSystemMessageToRequestThreads } from "@/lib/messages/addSystemMessageToThreads";
import type { Session } from "next-auth";

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

// ----------------------
// DELETE: remove request
// ----------------------
const deleteRequestHandler = async (
  req: Request,
  session: Session,
  context?: { params?: Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { id } = context.params;

  if (!id || typeof id !== "string")
    return NextResponse.json({ error: "Missing request ID" }, { status: 400 });

  const request = await DiscRequest.findById(id);
  if (!request)
    return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // Ownership check
  const requestUserId =
    typeof request.userId === "string"
      ? request.userId
      : request.userId._id.toString();

  if (requestUserId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await request.deleteOne();

  // Add system message to all threads connected to this request
  await addSystemMessageToRequestThreads(
    id,
    "This request has been deleted by the requester."
  );

  return NextResponse.json({ message: "Request deleted successfully" });
};

export const DELETE = withErrorHandling(
  withUserAuth(deleteRequestHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/requests/[id]"
);
