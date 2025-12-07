'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { logClientError } from '@/lib/clientLogger';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 🔹 Capture uncaught JS runtime errors
    const handleError = (event: ErrorEvent) => {
      logClientError(event.error || event.message, {
        route: window.location.pathname,
        severity: 'high',
        metadata: {
          type: 'window.onerror',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    // 🔹 Capture unhandled Promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      logClientError(event.reason || 'Unhandled rejection', {
        route: window.location.pathname,
        severity: 'medium',
        metadata: { type: 'unhandledrejection' },
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <SessionProvider>
      <GoogleAnalytics />
      <Toaster position="bottom-center" />
      <NavBar />
      {/* 👇 Add top padding to clear fixed navbar */}
      <main className="flex-grow pt-16 md:pt-20">{children}</main>
      <Footer />
    </SessionProvider>
  );
}

