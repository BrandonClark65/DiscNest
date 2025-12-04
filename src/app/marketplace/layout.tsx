import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Disc Golf Marketplace - Buy & Sell Discs',
  description: 'Buy and sell disc golf discs in our marketplace. Browse listings, connect with sellers, and find the perfect disc for your game.',
  openGraph: {
    title: 'Disc Golf Marketplace - Buy & Sell Discs | DiscNest',
    description: 'Buy and sell disc golf discs in our marketplace. Browse listings, connect with sellers, and find the perfect disc for your game.',
    url: `${baseUrl}/marketplace`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Disc Golf Marketplace - Buy & Sell Discs | DiscNest',
    description: 'Buy and sell disc golf discs in our marketplace.',
  },
  alternates: {
    canonical: `${baseUrl}/marketplace`,
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

