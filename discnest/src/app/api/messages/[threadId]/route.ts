import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MessageThread from "@/models/MessageThread";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { threadId: string } }) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thread = await MessageThread.findById(params.threadId)
    .populate("participants", "name")
    .populate("listingId", "title imageUrls");

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  return NextResponse.json(thread);
}
