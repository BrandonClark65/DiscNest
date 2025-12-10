import { NextResponse } from "next/server";
import { logError } from "@/lib/errorLogger";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";

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
      // Check if it's an UnauthorizedError and return 401 (check this BEFORE logging to avoid noise)
      // Check multiple ways to identify UnauthorizedError (handles cross-module issues)
      const errorString = String(err);
      const errorMessageStr = err instanceof Error ? err.message : 
                            (typeof err === "object" && err !== null && "message" in err) ? String(err.message) :
                            errorString;
      
      // Get error name from various sources
      const errorName = err instanceof Error ? err.name :
                        (typeof err === "object" && err !== null && "name" in err) ? String(err.name) :
                        (typeof err === "object" && err !== null && "constructor" in err && (err.constructor as { name?: string })?.name) ?
                        (err.constructor as { name?: string }).name : "";
      
      // Normalize strings for case-insensitive matching
      const normalizedMessage = errorMessageStr.toLowerCase();
      const normalizedString = errorString.toLowerCase();
      const normalizedName = errorName?.toLowerCase() || "";
      const normalizedFullMessage = message.toLowerCase();
      const normalizedStack = (err instanceof Error && err.stack) ? err.stack.toLowerCase() : "";
      
      // Check message first (most reliable across module boundaries) - case insensitive
      // Also check the full message string which includes "UnauthorizedError: ..."
      const messageContainsUnauthorized = 
        normalizedMessage.includes("unauthorized") ||
        normalizedMessage.includes("user must be logged in") ||
        normalizedString.includes("unauthorized") ||
        normalizedFullMessage.includes("unauthorized") ||
        normalizedStack.includes("unauthorized");
      
      // Then check error type/name - case insensitive
      // Also check all object properties for "unauthorized" (handles serialized errors)
      let objectContainsUnauthorized = false;
      if (typeof err === "object" && err !== null) {
        try {
          const errorJson = JSON.stringify(err);
          objectContainsUnauthorized = errorJson.toLowerCase().includes("unauthorized");
        } catch {
          // If JSON.stringify fails, check properties directly
          for (const key in err) {
            const value = String((err as Record<string, unknown>)[key]).toLowerCase();
            if (value.includes("unauthorized")) {
              objectContainsUnauthorized = true;
              break;
            }
          }
        }
      }
      
      const isUnauthorizedType = 
        err instanceof UnauthorizedError ||
        normalizedName === "unauthorizederror" ||
        normalizedName.includes("unauthorized") ||
        objectContainsUnauthorized ||
        (err instanceof Error && (
          err.name === "UnauthorizedError" ||
          err.constructor?.name === "UnauthorizedError"
        )) ||
        (typeof err === "object" && err !== null && (
          ("name" in err && (String(err.name).toLowerCase() === "unauthorizederror" || String(err.name).toLowerCase().includes("unauthorized"))) ||
          ("constructor" in err && (err.constructor as { name?: string })?.name === "UnauthorizedError") ||
          ("reason" in err && String(err.reason).toLowerCase().includes("unauthorized"))
        ));
      
      const isUnauthorized = messageContainsUnauthorized || isUnauthorizedType;
      
      if (isUnauthorized) {
        return NextResponse.json(
          { error: errorMessageStr || "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Log other errors
      console.error(`[API ERROR] ${routePath || req?.url || ""}\n`, message, err);
      
      return NextResponse.json(
        { error: message || "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
