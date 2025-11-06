export async function logClientError(
  error: unknown,
  options?: { route?: string; severity?: "low" | "medium" | "high" | "critical"; metadata?: any }
) {
  try {
    const message =
      error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    await fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        stack,
        route: options?.route || window.location.pathname,
        severity: options?.severity || "medium",
        metadata: options?.metadata,
      }),
    });
  } catch (err) {
    console.error("Failed to send client error log:", err);
  }
}
