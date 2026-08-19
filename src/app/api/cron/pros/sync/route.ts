import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { syncProRatings } from "@/lib/pros/proSync";

/**
 * Authorized either by the CRON_SECRET bearer token (how Vercel Cron and any
 * scheduler call it) or by an admin session (how the admin "Sync now" button
 * calls it). Everything else is rejected.
 */
async function isAuthorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

const syncHandler = async (req: Request) => {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const report = await syncProRatings();
  return NextResponse.json(report);
};

// GET is what Vercel Cron issues; POST is for the admin button. Same logic.
const looseSync = syncHandler as (...args: unknown[]) => Promise<NextResponse>;
export const GET = withErrorHandling(looseSync, "/api/cron/pros/sync");
export const POST = withErrorHandling(looseSync, "/api/cron/pros/sync");
