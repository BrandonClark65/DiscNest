import { connectToDatabase } from "@/lib/mongodb";
import ErrorLog from "@/models/ErrorLog";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "admin@discnest.com";
const ALERTS_EMAIL = "alerts@discnest.com";

export type LogErrorOptions = {
  // Primary error (raw Error, string, or object)
  error?: unknown;
  // Optional normalized message/stack (if already extracted)
  message?: string;
  stack?: string;
  // Contextual data
  route?: string;
  severity?: "low" | "medium" | "high" | "critical";
  userId?: string;
  metadata?: Record<string, any>;
  source?: "server" | "client";
};

export async function logError({
  error,
  message,
  stack,
  route,
  severity = "medium",
  userId,
  metadata = {},
  source = "server",
}: LogErrorOptions) {
  try {
    await connectToDatabase();

    // 🧠 Normalize message and stack
    const normalizedMessage =
      message ||
      (error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === "string"
        ? error
        : JSON.stringify(error, Object.getOwnPropertyNames(error)));

    const normalizedStack =
      stack ||
      (error instanceof Error
        ? error.stack
        : typeof error === "object"
        ? JSON.stringify(error)
        : undefined);

    // 1️⃣ Save to DB
    const newLog = await ErrorLog.create({
      message: normalizedMessage,
      stack: normalizedStack,
      route,
      severity,
      userId,
      metadata,
      source,
      createdAt: new Date(),
    });

    // 2️⃣ Send alert email for high/critical errors only
    if (["high", "critical"].includes(severity)) {
      const subject = `[${severity.toUpperCase()}] ${source.toUpperCase()} Error in ${
        route ?? "Unknown Route"
      }`;

      const text = `
A ${source} error occurred on DiscNest:

Message: ${normalizedMessage}
Route: ${route ?? "Unknown"}
Severity: ${severity}
Source: ${source}
User: ${userId ?? "Anonymous"}
Time: ${new Date().toISOString()}

Stack:
${normalizedStack ?? "(no stack trace)"}

Metadata:
${JSON.stringify(metadata, null, 2)}
      `;

      await resend.emails.send({
        from: `DiscNest Alerts <${ALERTS_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject,
        text,
      });
    }

    return newLog;
  } catch (loggerError) {
    console.error("❌ Failed to log error:", loggerError);
  }
}
