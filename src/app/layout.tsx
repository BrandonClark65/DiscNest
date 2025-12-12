import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter, Poppins } from 'next/font/google';
import ClientLayout from '@/components/ClientLayout';
import GoogleAnalyticsHead from '@/components/analytics/GoogleAnalyticsHead';
import { Analytics } from "@vercel/analytics/next"

// ✅ Include weight and subset options for Poppins and Inter
// display: 'swap' ensures text remains visible during webfont load (FOUT)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap', // Performance optimization: shows fallback font immediately
  preload: true, // Preload fonts for faster initial load
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
  display: 'swap', // Performance optimization: shows fallback font immediately
  preload: true, // Preload fonts for faster initial load
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: {
    default: 'DiscNest - Buy, Sell & Manage Disc Golf Discs',
    template: '%s | DiscNest',
  },
  description: 'The ultimate disc golf marketplace and bag builder. Buy and sell used disc golf discs, manage your bag, explore the catalog, and connect with players nationwide.',
  keywords: ['disc golf', 'frisbee golf', 'disc golf marketplace', 'used disc golf marketplace', 'disc golf bag builder', 'disc golf bag', 'disc golf catalog', 'buy disc golf discs', 'sell disc golf discs', 'disc golf buy sell', 'used disc golf discs'],
  authors: [{ name: 'DiscNest' }],
  creator: 'DiscNest',
  publisher: 'DiscNest',
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'DiscNest',
    title: 'DiscNest - Buy, Sell & Manage Disc Golf Discs',
    description: 'The ultimate disc golf marketplace and bag builder. Buy and sell used disc golf discs, manage your bag, explore the catalog, and connect with players nationwide.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DiscNest - Disc Golf Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiscNest - Buy, Sell & Manage Disc Golf Discs',
    description: 'The ultimate disc golf marketplace and bag builder. Buy and sell used disc golf discs.',
    images: ['/og-image.png'],
    creator: '@discnest',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
  },
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    // Primary favicon - Next.js automatically serves icon.png from app directory
    // Using absolute URLs for better search engine compatibility
    icon: [
      { url: new URL('/icon.png', baseUrl).toString(), sizes: 'any', type: 'image/png' },
      { url: new URL('/icon.png', baseUrl).toString(), sizes: '192x192', type: 'image/png' },
      { url: new URL('/icon.png', baseUrl).toString(), sizes: '32x32', type: 'image/png' },
      { url: new URL('/favicon.ico', baseUrl).toString(), sizes: 'any' },
    ],
    // Apple touch icon - should be 180x180 square
    apple: [
      { url: new URL('/icon.png', baseUrl).toString(), sizes: '180x180', type: 'image/png' },
    ],
    shortcut: new URL('/icon.png', baseUrl).toString(),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-background text-neutral-900 font-sans antialiased flex flex-col min-h-screen">
        {/* Google Analytics - Injects scripts directly into <head> */}
        <GoogleAnalyticsHead />
        <Analytics />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
