import type { Metadata } from 'next';
import StructuredData from '@/components/StructuredData';
import { HANDICAP_FAQ } from '@/components/handicap/HandicapGuide';

// Canonical host: matches src/app/layout.tsx and the www redirect in middleware.
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.discnest.com';

export const metadata: Metadata = {
  title: 'Disc Golf Handicap Calculator - Free Rating & Handicap Tool',
  description:
    'Free disc golf handicap calculator. Enter PDGA or UDisc round ratings, or plain scores, to get your rating and handicap in throws - and track your progress over time.',
  keywords: [
    'disc golf handicap calculator',
    'disc golf handicap',
    'how to calculate disc golf handicap',
    'disc golf rating calculator',
    'PDGA rating calculator',
    'UDisc rating converter',
    'disc golf league handicap',
    'disc golf scoring average',
  ],
  openGraph: {
    title: 'Disc Golf Handicap Calculator - Free Rating & Handicap Tool | DiscNest',
    description:
      'Calculate your disc golf handicap from PDGA or UDisc round ratings, or plain scores. Free, no account needed, with progress tracking when you sign in.',
    url: `${baseUrl}/handicap`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og-handicap.png`,
        width: 1200,
        height: 630,
        alt: 'DiscNest Disc Golf Handicap Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Disc Golf Handicap Calculator | DiscNest',
    description:
      'Free disc golf handicap calculator supporting PDGA and UDisc round ratings, with progress tracking.',
    images: [`${baseUrl}/og-handicap.png`],
  },
  alternates: {
    canonical: `${baseUrl}/handicap`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HandicapLayout({ children }: { children: React.ReactNode }) {
  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Disc Golf Handicap Calculator',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Any',
    description:
      'Calculate your disc golf handicap and rating from PDGA round ratings, UDisc round ratings, or raw scores. Saves rounds and charts progress for signed-in players.',
    url: `${baseUrl}/handicap`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Handicap from PDGA round ratings',
      'Handicap from UDisc round ratings',
      'Handicap from raw scores and course rating (SSA)',
      'Best 8 of last 20 rounds, matching the World Handicap System',
      'Handicap in throws for any target rating',
      'Saved handicap snapshots and progress chart',
    ],
  };

  // Mirrors the FAQ rendered in HandicapGuide so the markup and the schema
  // never drift apart. Google restricted FAQ rich results to government and
  // health sites in 2023, so this is for semantic clarity rather than snippets.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HANDICAP_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <StructuredData data={webApplicationSchema} id="handicap-app-schema" />
      <StructuredData data={faqSchema} id="handicap-faq-schema" />
      {children}
    </>
  );
}
