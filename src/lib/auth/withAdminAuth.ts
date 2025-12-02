import { NextResponse } from "next/server";
import { requireAdmin } from "./requireAdmin";

/**
 * Admin-only wrapper that works with BOTH:
 *  - (req) style handlers
 *  - (req, context) style App Router handlers
 */
export function withAdminAuth(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      // ensures admin session
      await requireAdmin();

      // If handler expects (req, context), pass context through
      if (args.length > 0) {
        return await handler(req, ...args);
      }

      // Otherwise call the standard 1-arg handler
      return await handler(req);
    } catch (err: any) {
      console.error("[withAdminAuth]", err);
      const status = err.name === "UnauthorizedError" ? 403 : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
  };
}
