import { NextResponse } from "next/server";
import { logError } from "@/lib/errorLogger";

/**
 * Generic error-handling wrapper for API routes.
 * Works with any handler signature, including (req, session, context?).
 */
export function withErrorHandling<
  T extends (...args: any[]) => Promise<NextResponse>
>(
  handler: T,
  routePath?: string
): (...args: Parameters<T>) => Promise<NextResponse> {
  return async (...args: Parameters<T>): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      try {
        const req = args[0] as Request;
        await logError({
          error: err,
          route: routePath || req?.url || "unknown",
          severity: "high",
          metadata: { method: req?.method },
        });
      } catch (logErr) {
        console.error("Failed to log error:", logErr);
      }

      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
