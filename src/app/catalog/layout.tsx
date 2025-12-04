import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Disc Golf Catalog - Browse All Discs',
  description: 'Browse our comprehensive catalog of disc golf discs from top brands. Filter by brand, type, speed, stability, and more. Add discs to your shelf or bag.',
  openGraph: {
    title: 'Disc Golf Catalog - Browse All Discs | DiscNest',
    description: 'Browse our comprehensive catalog of disc golf discs from top brands. Filter by brand, type, speed, stability, and more.',
    url: `${baseUrl}/catalog`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Disc Golf Catalog - Browse All Discs | DiscNest',
    description: 'Browse our comprehensive catalog of disc golf discs from top brands.',
  },
  alternates: {
    canonical: `${baseUrl}/catalog`,
  },
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

