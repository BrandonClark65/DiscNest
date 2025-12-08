import { connectToDatabase } from "@/lib/mongodb";
import ErrorLog from "@/models/ErrorLog";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Admin email for receiving alerts
// Note: Will be validated by env.ts at startup, but we allow undefined here for graceful degradation
// This allows the module to load in test environments where env vars may not be set
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// From email for alert notifications (uses RESEND_FROM_PROD/DEV if not set)
// Falls back to RESEND_FROM_PROD/DEV based on environment, then to development fallback
const ALERTS_EMAIL = process.env.FROM_ALERT_EMAIL || 
  (process.env.NODE_ENV === "production" 
    ? process.env.RESEND_FROM_PROD 
    : process.env.RESEND_FROM_DEV) || 
  (process.env.NODE_ENV === "production" ? undefined : "alerts@discnest.com"); // Final fallback only for development

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
  metadata?: Record<string, unknown>;
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
      // Only send email if both from and to emails are configured
      if (ALERTS_EMAIL && ADMIN_EMAIL) {
        try {
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
        } catch (emailError) {
          // Log error but don't fail error logging
          console.error('⚠️ Failed to send error alert email:', emailError);
        }
      } else {
        // Log warning if email configuration is missing
        console.error('⚠️ Cannot send error alert: FROM_ALERT_EMAIL/RESEND_FROM_PROD/RESEND_FROM_DEV or ADMIN_EMAIL not configured');
      }
    }

    return newLog;
  } catch (loggerError) {
    console.error("❌ Failed to log error:", loggerError);
  }
}
