import { NextResponse } from "next/server";
import { logError } from "@/lib/errorLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Logs client-side runtime and promise errors
 * sent from logClientError() in the frontend.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

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
        : message?.message ||
          (typeof message === "object"
            ? JSON.stringify(message, Object.getOwnPropertyNames(message))
            : String(message ?? "Unknown client error"));

    const normalizedStack =
      typeof stack === "string"
        ? stack
        : stack
        ? JSON.stringify(stack)
        : undefined;

    // --- 📩 Log structured error ---
    await logError({
      message: normalizedMessage,
      stack: normalizedStack,
      route: route || "client",
      severity: severity || "medium",
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
