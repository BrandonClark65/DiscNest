import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ErrorLog from "@/models/ErrorLog";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";

// GET /api/admin/errors
export const GET = withAdminAuth(async () => {
  try {
    await connectToDatabase();

    const logs = await ErrorLog.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("Failed to fetch error logs:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});

// PATCH /api/admin/errors
export const PATCH = withAdminAuth(async (req: Request) => {
  try {
    await connectToDatabase();

    const { id, resolved } = await req.json();
    const updated = await ErrorLog.findByIdAndUpdate(id, { resolved }, { new: true });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Failed to update error log:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
