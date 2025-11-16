import { NextResponse } from "next/server";
import UserReport from "@/models/UserReport";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { connectToDatabase } from "@/lib/mongodb";

const getReports = async () => {
  await connectToDatabase();

  const reports = await UserReport.find({})
    .populate("reporter", "name email")
    .populate("reportedUser", "name email")
    .populate("listingId", "title")
    .populate("threadId", "participants")
    .sort({ createdAt: -1 });

  return NextResponse.json(reports);
};

export const GET = withAdminAuth(withErrorHandling(getReports));
