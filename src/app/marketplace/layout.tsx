import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import Listing from '@/models/Listing';
import { MARKETPLACE_ENABLED } from '@/lib/features';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export async function generateMetadata(): Promise<Metadata> {
  // While the marketplace is off, keep the route out of search results.
  if (!MARKETPLACE_ENABLED) {
    return {
      title: 'DiscNest',
      robots: { index: false, follow: false },
    };
  }

  // Fetch listing count for metadata
  let listingCount = 0;
  try {
    await connectToDatabase();
    listingCount = await Listing.countDocuments({
      pendingReview: { $ne: true },
      sold: { $ne: true },
    });
  } catch (error) {
    // If database is unavailable, use generic description
    console.warn('[Marketplace Layout] Could not fetch listing count for metadata:', error);
  }

  const description = listingCount > 0
    ? `Buy and sell disc golf discs in our marketplace. Browse ${listingCount} active listings, connect with sellers, and find the perfect disc for your game.`
    : 'Buy and sell disc golf discs in our marketplace. Browse listings, connect with sellers, and find the perfect disc for your game.';

  return {
    title: 'Disc Golf Marketplace - Buy & Sell Used Disc Golf Discs',
    description,
    keywords: ['disc golf marketplace', 'used disc golf marketplace', 'buy disc golf discs', 'sell disc golf discs', 'disc golf buy sell', 'used disc golf discs for sale'],
    openGraph: {
      title: 'Disc Golf Marketplace - Buy & Sell Used Disc Golf Discs | DiscNest',
      description,
      url: `${baseUrl}/marketplace`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Disc Golf Marketplace - Buy & Sell Used Disc Golf Discs | DiscNest',
      description,
    },
    alternates: {
      canonical: `${baseUrl}/marketplace`,
    },
  };
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  // The marketplace is deactivated. Send every route under it back to the home
  // page rather than rendering an empty shell. Flip NEXT_PUBLIC_MARKETPLACE_ENABLED
  // to restore it.
  if (!MARKETPLACE_ENABLED) {
    redirect('/');
  }

  return <>{children}</>;
}
