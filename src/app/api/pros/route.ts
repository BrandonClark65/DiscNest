import { NextResponse } from "next/server";
import { getActivePros } from "@/lib/pros/proService";
import { withErrorHandling } from "@/lib/withErrorHandling";

/**
 * The pro list is identical for every visitor and changes at most monthly, so
 * it is cached hard at the edge. This is the deliberate opposite of the
 * no-store used on the per-user handicap routes - nothing here is personal.
 */
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

/**
 * GET /api/pros
 *
 * Public list of active pros for the handicap comparison. Returns only
 * display-safe fields (see proService) - never manualOverride or sync internals.
 */
const listProsHandler = async (): Promise<NextResponse> => {
  const pros = await getActivePros();
  return NextResponse.json({ pros }, { headers: CACHE_HEADERS });
};

export const GET = withErrorHandling(
  listProsHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/pros"
);
