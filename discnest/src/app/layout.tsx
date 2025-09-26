import './globals.css';
import { SessionProvider } from 'next-auth/react';
import AuthRedirect from '@/components/AuthRedirect';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AuthRedirect />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
