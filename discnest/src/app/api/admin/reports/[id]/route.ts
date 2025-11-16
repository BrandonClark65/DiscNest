import { NextResponse } from "next/server";
import UserReport from "@/models/UserReport";
import User from "@/models/User";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { connectToDatabase } from "@/lib/mongodb";

const actionHandler = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  await connectToDatabase();

  const { action } = await req.json();
  const report = await UserReport.findById(params.id);

  if (!report)
    return NextResponse.json({ error: "Report not found" }, { status: 404 });

  // --- Actions ---
  if (action === "resolve") {
    report.status = "resolved";
    await report.save();
  }

  if (action === "reject") {
    report.status = "rejected";
    await report.save();
  }

  if (action === "ban") {
    await User.findByIdAndUpdate(report.reportedUser, {
      $inc: { moderationFlags: 1 },
      $set: { lastFlaggedAt: new Date(), role: "banned" },
    });

    report.status = "resolved";
    await report.save();
  }

  return NextResponse.json({ success: true });
};

export const POST = withAdminAuth(withErrorHandling(actionHandler));
