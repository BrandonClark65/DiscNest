import type { Metadata } from 'next';
import Script from 'next/script';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Disc Golf Bag Builder - Manage Your Disc Collection',
  description: 'Build and manage your disc golf bag with our powerful bag builder. Track your collection, organize between shelf and bag, view stats, and get personalized recommendations.',
  keywords: ['disc golf bag builder', 'disc golf bag', 'disc golf collection', 'manage disc golf bag', 'disc golf bag tracker'],
  openGraph: {
    title: 'Disc Golf Bag Builder - Manage Your Disc Collection | DiscNest',
    description: 'Build and manage your disc golf bag with our powerful bag builder. Track your collection, organize between shelf and bag, view stats, and get personalized recommendations.',
    url: `${baseUrl}/gear`,
    type: 'website',
  },
  alternates: {
    canonical: `${baseUrl}/gear`,
  },
  robots: {
    index: true, // Make bag builder discoverable for SEO
    follow: true,
  },
};

export default function GearLayout({ children }: { children: React.ReactNode }) {
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Disc Golf Bag Builder',
    applicationCategory: 'SportsApplication',
    description: 'Build and manage your disc golf bag. Track your collection, organize between shelf and bag, view stats, and get personalized recommendations.',
    url: `${baseUrl}/gear`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Disc collection management',
      'Bag and shelf organization',
      'Bag statistics and analysis',
      'Personalized disc recommendations',
      'Shareable bag links',
    ],
  };

  return (
    <>
      <Script
        id="bag-builder-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      {children}
    </>
  );
}

