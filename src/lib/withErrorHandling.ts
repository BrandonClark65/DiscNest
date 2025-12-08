import { NextResponse } from "next/server";
import { logError } from "@/lib/errorLogger";

/**
 * Universal error-handling wrapper for API routes.
 * Catches thrown errors, normalizes message/stack,
 * and writes to the ErrorLog collection.
 */
export function withErrorHandling<
  T extends (...args: unknown[]) => Promise<NextResponse>
>(
  handler: T,
  routePath?: string
): (...args: Parameters<T>) => Promise<NextResponse> {
  return async (...args: Parameters<T>): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err: unknown) {
      // --- 🧠 Normalize error ---
      const req = args[0] as Request | undefined;

      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
          ? `${err.name}: ${err.message}`
          : JSON.stringify(err, Object.getOwnPropertyNames(err));

      const stack =
        err instanceof Error
          ? err.stack
          : typeof err === "object"
          ? JSON.stringify(err, null, 2)
          : String(err);

      // --- 📩 Log structured error ---
      try {
        await logError({
          message,
          stack,
          route: routePath || req?.url || "unknown",
          severity: "high",
          metadata: {
            method: req?.method,
            rawError:
              err instanceof Error
                ? { name: err.name, cause: 'cause' in err ? (err as { cause?: unknown }).cause : undefined }
                : err,
          },
        });
      } catch (logErr) {
        console.error("Failed to log error:", logErr);
      }

      // --- 💥 Respond gracefully ---
      console.error(`[API ERROR] ${routePath || req?.url || ""}\n`, message, err);
      
      // Check if it's an UnauthorizedError and return 401
      if (err instanceof Error && err.name === "UnauthorizedError") {
        return NextResponse.json(
          { error: err.message || "Unauthorized" },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: message || "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
