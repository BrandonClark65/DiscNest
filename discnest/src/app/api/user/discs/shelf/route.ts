import { NextResponse } from "next/server";
import { User } from "@/models";
import { connectToDatabase } from "@/lib/mongodb";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";

/* ---------- Handler ---------- */
const getShelfHandler = async (_req: Request, session: any) => {
  await connectToDatabase();

  const user = await User.findById(session.user.id).populate("discShelf");

  if (!user) {
    // ✅ Return empty shelf for missing user
    return NextResponse.json({ shelf: [] }, { status: 200 });
  }

  return NextResponse.json({ shelf: user.discShelf || [] }, { status: 200 });
};

/* ---------- Export ---------- */
export const GET = withErrorHandling(
  withUserAuth(getShelfHandler),
  "/api/shelf"
);
