import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { importRatings } from "@/lib/pros/proImport";

/**
 * POST /api/admin/pros/import
 * Body: { text: string, createMissing?: boolean }
 *
 * Applies pasted PDGA-stats or CSV rows to the pro collection, matching by
 * PDGA number. This is the monthly ratings-refresh path until the PDGA API is
 * wired in.
 */
const importHandler = async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "Paste some rows first." }, { status: 400 });
  }

  const report = await importRatings(text, { createMissing: Boolean(body.createMissing) });
  return NextResponse.json(report);
};

export const POST = withAdminAuth(
  withErrorHandling(
    importHandler as (...args: unknown[]) => Promise<NextResponse>,
    "/api/admin/pros/import"
  )
);
