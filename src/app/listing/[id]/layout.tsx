import type { Metadata } from 'next';
import Script from 'next/script';
import { redirect } from 'next/navigation';
import { MARKETPLACE_ENABLED } from '@/lib/features';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  if (!MARKETPLACE_ENABLED) {
    return { title: 'DiscNest', robots: { index: false, follow: false } };
  }

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
      alternates: {
        canonical: `${baseUrl}/listing/${id}`,
      },
    };
  } catch (err) {
    console.error('[DiscNest] Metadata generation failed:', err);
    return { title: 'Listing | DiscNest' };
  }
}

export default async function ListingLayout({ 
  children,
  params 
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Listing detail pages belong to the deactivated marketplace.
  if (!MARKETPLACE_ENABLED) {
    redirect('/');
  }

  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

  const apiUrl =
    process.env.NODE_ENV === 'production'
      ? `${baseUrl}/api/listings/${id}`
      : `http://localhost:3000/api/listings/${id}`;

  let structuredData = null;
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const listing = data.listing;

      interface ProductSchema {
        '@context': string;
        '@type': string;
        name: string;
        description: string;
        image: string[];
        category: string;
        offers: {
          '@type': string;
          price: number;
          priceCurrency: string;
          availability: string;
          seller: {
            '@type': string;
            name: string;
          };
          url: string;
        };
        brand?: {
          '@type': string;
          name: string;
        };
        itemCondition?: string;
      }

      const productData: ProductSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: listing.title,
        description: listing.description || 'Disc golf disc for sale on DiscNest',
        image: listing.imageUrls?.length ? listing.imageUrls : [`${baseUrl}/og-listing-preview.png`],
        category: 'Disc Golf Equipment',
        offers: {
          '@type': 'Offer',
          price: listing.price || 0,
          priceCurrency: 'USD',
          availability: listing.sold 
            ? 'https://schema.org/SoldOut' 
            : 'https://schema.org/InStock',
          seller: {
            '@type': 'Person',
            name: listing.sellerName || 'DiscNest User',
          },
          url: `${baseUrl}/listing/${id}`,
        },
      };

      // Only add brand if it exists (avoid undefined in JSON)
      if (listing.brand) {
        productData.brand = {
          '@type': 'Brand',
          name: listing.brand,
        };
      }

      // Only add itemCondition if condition exists
      if (listing.condition) {
        productData.itemCondition = `https://schema.org/${listing.condition === 'New' ? 'NewCondition' : 'UsedCondition'}`;
      }

      structuredData = productData;
    }
  } catch (err) {
    console.error('[DiscNest] Structured data generation failed:', err);
  }

  return (
    <>
      {structuredData && (
        <Script
          id="product-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      {children}
    </>
  );
}
