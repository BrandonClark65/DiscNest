import { NextResponse, NextRequest } from "next/server";
import { requireUser } from "./requireUser";

/**
 * Wraps any API route handler to enforce user authentication.
 * Passes (req, session, context) into the wrapped handler.
 * Compatible with Next.js 15 where params is a Promise.
 */
export function withUserAuth<
  T extends { params?: Record<string, unknown> } = Record<string, never>
>(
  handler: (
    req: Request,
    session: Awaited<ReturnType<typeof requireUser>>,
    context?: T
  ) => Promise<NextResponse>
): (request: NextRequest, context: { params: Promise<Record<string, unknown>> }) => void | Response | Promise<void | Response> {
  return async (request: NextRequest, context: { params: Promise<Record<string, unknown>> }) => {
    try {
      const session = await requireUser();
      // Resolve params Promise (Next.js 15) - for routes without dynamic segments, this will be {}
      const resolvedParams = await context.params;
      const resolvedContext = { params: resolvedParams as Record<string, unknown> } as T;
      // Call handler - it may or may not use the context parameter
      return await handler(request, session, resolvedContext);
    } catch (err: unknown) {
      console.error("[withUserAuth]", err);
      const error = err as { name?: string; message?: string };
      const status = error.name === "UnauthorizedError" ? 401 : 500;
      return NextResponse.json({ error: error.message || "Internal server error" }, { status });
    }
  };
}
