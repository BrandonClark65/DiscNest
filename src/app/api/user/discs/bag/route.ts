import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import type { Session } from "next-auth";

/* ---------- Handler ---------- */
const getBagHandler = async (_req: Request, session: Session) => {
  await connectToDatabase();

  const user = await User.findById(session.user.id).populate("bag");

  if (!user) {
    return NextResponse.json({ bag: [] }, { status: 200 });
  }

  return NextResponse.json({ bag: user.bag || [] }, { status: 200 });
};

/* ---------- Export ---------- */
export const GET = withErrorHandling(
  withUserAuth(getBagHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/bag"
);
