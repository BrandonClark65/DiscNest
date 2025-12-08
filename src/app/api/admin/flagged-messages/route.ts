import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FlaggedMessage from "@/models/FlaggedMessage";

export async function GET() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await FlaggedMessage.find({ status: "pending" })
    .populate("sender", "name email moderationFlags")
    .populate("threadId", "listingId")
    .sort({ createdAt: -1 });

  return NextResponse.json(messages);
}
