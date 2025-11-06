import { connectToDatabase } from "@/lib/mongodb";
import ErrorLog from "@/models/ErrorLog";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "admin@discnest.com";
const ALERTS_EMAIL = "alerts@discnest.com";

type LogErrorOptions = {
  error: unknown;
  route?: string;
  severity?: "low" | "medium" | "high" | "critical";
  userId?: string;
  metadata?: Record<string, any>;
  source?: "server" | "client"; // ✅ NEW
};

export async function logError({
  error,
  route,
  severity = "medium",
  userId,
  metadata = {},
  source = "server", // ✅ default to server
}: LogErrorOptions) {
  try {
    await connectToDatabase();

    const message =
      error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // 1️⃣ Save to DB
    const newLog = await ErrorLog.create({
      message,
      stack,
      route,
      severity,
      userId,
      metadata,
      source,
    });

    // 2️⃣ Send alert email
    const subject = `[${severity.toUpperCase()}] ${source.toUpperCase()} Error in ${
      route ?? "Unknown Route"
    }`;

    const text = `
        A ${source} error occurred on DiscNest:

        Message: ${message}
        Route: ${route ?? "Unknown"}
        Severity: ${severity}
        Source: ${source}
        Time: ${new Date().toISOString()}

        Stack:
        ${stack ?? "(no stack trace)"}

        Metadata:
        ${JSON.stringify(metadata, null, 2)}
    `;

    await resend.emails.send({
      from: `DiscNest Alerts <${ALERTS_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject,
      text,
    });

    return newLog;
  } catch (loggerError) {
    console.error("Failed to log error:", loggerError);
  }
}
