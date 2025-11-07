export async function logClientError(
  error: unknown,
  options?: {
    route?: string;
    severity?: "low" | "medium" | "high" | "critical";
    metadata?: any;
  }
) {
  try {
    // --- 🧠 Normalize error ---
    let message: string;
    let stack: string | undefined;

    if (error instanceof Error) {
      message = `${error.name}: ${error.message}`;
      stack = error.stack;
    } else if (typeof error === "object") {
      try {
        message = JSON.stringify(error, Object.getOwnPropertyNames(error));
      } catch {
        message = String(error);
      }
    } else {
      message = String(error);
    }

    // --- 📤 Send to backend logger ---
    await fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        stack,
        route: options?.route || window.location.pathname,
        severity: options?.severity || "medium",
        metadata: options?.metadata,
        source: "client",
      }),
    });
  } catch (err) {
    console.error("Failed to send client error log:", err);
  }
}
