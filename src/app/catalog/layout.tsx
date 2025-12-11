import type { Metadata } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export async function generateMetadata(): Promise<Metadata> {
  // Fetch disc count for metadata
  let discCount = 0;
  try {
    await connectToDatabase();
    discCount = await Disc.countDocuments({ userId: { $exists: false } });
  } catch (error) {
    // If database is unavailable, use generic description
    console.warn('[Catalog Layout] Could not fetch disc count for metadata:', error);
  }

  const description = discCount > 0
    ? `Browse our comprehensive catalog of ${discCount} disc golf discs from top brands. Filter by brand, type, speed, stability, and more. Add discs to your shelf or bag.`
    : 'Browse our comprehensive catalog of disc golf discs from top brands. Filter by brand, type, speed, stability, and more. Add discs to your shelf or bag.';

  return {
    title: 'Disc Golf Catalog - Browse All Discs',
    description,
    openGraph: {
      title: 'Disc Golf Catalog - Browse All Discs | DiscNest',
      description,
      url: `${baseUrl}/catalog`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Disc Golf Catalog - Browse All Discs | DiscNest',
      description,
    },
    alternates: {
      canonical: `${baseUrl}/catalog`,
    },
  };
}

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

