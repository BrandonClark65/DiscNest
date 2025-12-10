import { NextResponse } from "next/server";
import { logError } from "@/lib/errorLogger";

/**
 * Logs client-side runtime and promise errors
 * sent from logClientError() in the frontend.
 */
export async function POST(req: Request) {
  try {
    // Session is optional for client error logging
    let session: { user?: { id?: string } } | null = null;
    try {
      const { requireUser } = await import("@/lib/auth/requireUser");
      session = await requireUser();
    } catch {
      // User not authenticated, continue without session
    }

    // Parse request body safely
    interface ErrorBody {
      message?: string | { message?: string } | unknown;
      stack?: string | unknown;
      route?: string;
      metadata?: Record<string, unknown>;
      severity?: string;
    }

    let body: ErrorBody;
    try {
      body = await req.json() as ErrorBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { message, stack, route, metadata, severity } = body;

    // --- 🧠 Normalize message ---
    const normalizedMessage =
      typeof message === "string"
        ? message
        : (typeof message === "object" && message !== null && "message" in message
            ? (message as { message?: string }).message
            : undefined) ||
          (typeof message === "object" && message !== null
            ? JSON.stringify(message, Object.getOwnPropertyNames(message))
            : String(message ?? "Unknown client error"));

    const normalizedStack =
      typeof stack === "string"
        ? stack
        : stack
        ? JSON.stringify(stack)
        : undefined;

    // --- 📩 Log structured error ---
    const validSeverities = ["low", "medium", "high", "critical"] as const;
    const errorSeverity = (validSeverities.includes(severity as typeof validSeverities[number]) 
      ? severity 
      : "medium") as "low" | "medium" | "high" | "critical";
    
    await logError({
      message: normalizedMessage,
      stack: normalizedStack,
      route: route || "client",
      severity: errorSeverity,
      userId: session?.user?.id,
      metadata: {
        source: "client",
        ...metadata,
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : JSON.stringify(err);
    console.error("Failed to log client error:", msg);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
