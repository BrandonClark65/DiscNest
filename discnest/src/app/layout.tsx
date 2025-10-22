'use client';

import './globals.css';
import 'leaflet/dist/leaflet.css';
import { SessionProvider } from 'next-auth/react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import { Inter, Poppins } from 'next/font/google';

// ✅ Include weight and subset options for Poppins and Inter
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-background text-neutral-900 font-sans antialiased flex flex-col min-h-screen">
        <SessionProvider>
          <Toaster position="bottom-center" />
          <NavBar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
