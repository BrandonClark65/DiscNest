import { NextResponse } from "next/server";
import { requireAdmin } from "./requireAdmin";

/**
 * Wraps any API route handler to enforce admin-only access.
 * Automatically handles UnauthorizedError responses.
 */
export function withAdminAuth(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      await requireAdmin(); // Ensures session exists and user is admin
      return await handler(req);
    } catch (err: any) {
      console.error("[withAdminAuth]", err);
      const status = err.name === "UnauthorizedError" ? 403 : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
  };
}
