import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "./requireAdmin";

/**
 * Admin-only wrapper for Next.js 15 route handlers.
 * Compatible with Next.js 15 where params is a Promise.
 */
export function withAdminAuth<
  T extends { params?: Record<string, unknown> } = Record<string, never>
>(
  handler: (
    req: Request,
    context?: T
  ) => Promise<NextResponse>
): (request: NextRequest, context: { params: Promise<Record<string, unknown>> }) => void | Response | Promise<void | Response> {
  return async (request: NextRequest, context: { params: Promise<Record<string, unknown>> }) => {
    try {
      // ensures admin session
      await requireAdmin();

      // Resolve params Promise (Next.js 15) - for routes without dynamic segments, this will be {}
      const resolvedParams = await context.params;
      const resolvedContext = { params: resolvedParams as Record<string, unknown> } as T;
      // Call handler - it may or may not use the context parameter
      return await handler(request, resolvedContext);
    } catch (err: unknown) {
      console.error("[withAdminAuth]", err);
      const error = err as { name?: string; message?: string };
      const status = error.name === "UnauthorizedError" ? 403 : 500;
      return NextResponse.json({ error: error.message || "Internal server error" }, { status });
    }
  };
}
