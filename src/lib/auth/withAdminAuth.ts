import { NextResponse } from "next/server";
import { requireAdmin } from "./requireAdmin";

type Handler = (req: Request, ...args: unknown[]) => Promise<NextResponse>;

/**
 * Admin-only wrapper that works with BOTH:
 *  - (req) style handlers
 *  - (req, context) style App Router handlers
 */
export function withAdminAuth(handler: Handler) {
  return async (req: Request, ...args: unknown[]) => {
    try {
      // ensures admin session
      await requireAdmin();

      // If handler expects (req, context), pass context through
      if (args.length > 0) {
        return await handler(req, ...args);
      }

      // Otherwise call the standard 1-arg handler
      return await handler(req);
    } catch (err: unknown) {
      console.error("[withAdminAuth]", err);
      const error = err as { name?: string; message?: string };
      const status = error.name === "UnauthorizedError" ? 403 : 500;
      return NextResponse.json({ error: error.message || "Internal server error" }, { status });
    }
  };
}
