import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { withErrorHandling } from "@/lib/withErrorHandling";

/* ---------- Handler ---------- */
const onboardingHandler = async (req: Request) => {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  await connectToDatabase();

  await User.updateOne({ email }, { hasOnboarded: true });

  return NextResponse.json({ success: true });
};

/* ---------- Export ---------- */
export const POST = withErrorHandling(
  onboardingHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/onboarding"
);
