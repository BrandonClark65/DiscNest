'use client';

import { logClientError } from "@/lib/clientLogger";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error once to the backend
    logClientError(error, {
      route: typeof window !== 'undefined' ? window.location.pathname : 'global',
      severity: 'high',
      metadata: { digest: error.digest || 'no-digest' },
    });
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-gray-50">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
        <p className="text-gray-700 mb-4">{error.message}</p>
        <button
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
