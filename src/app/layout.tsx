import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter, Poppins } from 'next/font/google';
import ClientLayout from '@/components/ClientLayout';

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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: {
    default: 'DiscNest - Buy, Sell & Manage Disc Golf Discs',
    template: '%s | DiscNest',
  },
  description: 'The ultimate platform for disc golf enthusiasts. Buy and sell discs, manage your bag, explore the catalog, and connect with players.',
  keywords: ['disc golf', 'frisbee golf', 'disc golf marketplace', 'disc golf bag', 'disc golf catalog', 'buy disc golf discs', 'sell disc golf discs'],
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
    description: 'The ultimate platform for disc golf enthusiasts. Buy and sell discs, manage your bag, explore the catalog, and connect with players.',
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
    description: 'The ultimate platform for disc golf enthusiasts.',
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-background text-neutral-900 font-sans antialiased flex flex-col min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
