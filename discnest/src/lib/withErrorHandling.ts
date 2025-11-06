import { NextResponse } from "next/server";
import { logError } from "@/lib/errorLogger";

/**
 * Wraps an API route handler to automatically log uncaught errors
 * and return a standardized JSON error response.
 *
 * Usage:
 *   export const GET = withErrorHandling(handler, "/api/example");
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<NextResponse>,
  routePath?: string
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      // Log error to DB + email alert
      await logError({
        error: err,
        route: routePath || req.url || "unknown",
        severity: "high",
        metadata: { method: req.method },
      });

      // Return safe JSON response
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
