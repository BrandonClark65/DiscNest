import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

  const apiUrl =
    process.env.NODE_ENV === 'production'
      ? `${baseUrl}/api/listings/${id}`
      : `http://localhost:3000/api/listings/${id}`;

  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (!res.ok) return { title: 'Listing | DiscNest' };

    const data = await res.json();
    const listing = data.listing;

    return {
      title: `${listing.title} | DiscNest`,
      description: listing.description || 'Check out this disc on DiscNest!',
      openGraph: {
        title: `${listing.title} | DiscNest`,
        description: listing.description || 'Available on DiscNest',
        images: listing.imageUrls?.length
          ? listing.imageUrls
          : [`${baseUrl}/og-listing-preview.png`],
        url: `${baseUrl}/listing/${id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${listing.title} | DiscNest`,
        description: listing.description || 'Available on DiscNest',
        images: listing.imageUrls?.length
          ? listing.imageUrls
          : [`${baseUrl}/og-listing-preview.png`],
      },
    };
  } catch (err) {
    console.error('[DiscNest] Metadata generation failed:', err);
    return { title: 'Listing | DiscNest' };
  }
}

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
