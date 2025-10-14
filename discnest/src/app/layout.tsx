'use client';

import './globals.css';
import 'leaflet/dist/leaflet.css';

import { SessionProvider } from 'next-auth/react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 flex flex-col min-h-screen">
        <SessionProvider>
          <Toaster position="bottom-center" /> {/* ✅ Toasts will show globally */}
          <NavBar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
