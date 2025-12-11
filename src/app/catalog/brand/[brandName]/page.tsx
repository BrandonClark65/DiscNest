import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';
import type { Disc as DiscType } from '@/types/disc';
import BrandClient from './BrandClient';
import StructuredData from '@/components/StructuredData';

// Brand descriptions for SEO and user information
const brandDescriptions: Record<string, { description: string; keywords: string[] }> = {
  'Discmania': {
    description: 'Explore Discmania disc golf discs, known for innovative designs and professional player endorsements. Browse drivers, midranges, and putters from this premium disc golf brand.',
    keywords: ['Discmania discs', 'Discmania disc golf', 'Discmania drivers', 'Discmania putters']
  },
  'Discraft': {
    description: 'Browse Discraft disc golf discs, one of the most popular brands in disc golf. Find drivers, midranges, and putters from this established manufacturer.',
    keywords: ['Discraft discs', 'Discraft disc golf', 'Discraft drivers', 'Discraft putters']
  },
  'Dynamic Discs': {
    description: 'Discover Dynamic Discs disc golf discs, featuring a wide range of molds for all skill levels. Shop drivers, midranges, and putters from this trusted brand.',
    keywords: ['Dynamic Discs', 'Dynamic Discs discs', 'Dynamic Discs disc golf', 'Dynamic Discs drivers']
  },
  'Innova': {
    description: 'Shop Innova disc golf discs, the original disc golf manufacturer. Browse the largest selection of drivers, midranges, and putters from the most established brand in disc golf.',
    keywords: ['Innova discs', 'Innova disc golf', 'Innova drivers', 'Innova putters', 'Innova Champion', 'Innova Star']
  },
  'Latitude 64': {
    description: 'Explore Latitude 64 disc golf discs, known for Scandinavian design and quality. Browse drivers, midranges, and putters from this innovative European brand.',
    keywords: ['Latitude 64 discs', 'Latitude 64 disc golf', 'Latitude 64 drivers', 'Latitude 64 putters']
  },
  'MVP': {
    description: 'Browse MVP disc golf discs, featuring overmold technology for enhanced stability. Discover drivers, midranges, and putters from this innovative manufacturer.',
    keywords: ['MVP discs', 'MVP disc golf', 'MVP drivers', 'MVP putters', 'MVP overmold']
  },
  'Prodigy': {
    description: 'Shop Prodigy disc golf discs, designed by professional players. Find drivers, midranges, and putters from this performance-focused brand.',
    keywords: ['Prodigy discs', 'Prodigy disc golf', 'Prodigy drivers', 'Prodigy putters']
  }
};

async function getBrandDiscs(brandName: string): Promise<DiscType[]> {
  try {
    await connectToDatabase();
    
    // Fetch discs for this brand server-side (same query pattern as catalog)
    const discs = await Disc.find(
      { 
        userId: { $exists: false },
        brand: brandName 
      },
      'name brand type addedAt image stability flight'
    )
      .sort({ name: 1 }) // Sort by name within brand
      .lean();

    // Convert MongoDB documents to plain objects with proper typing
    return discs.map((disc) => {
      const discDoc = disc as unknown as {
        _id: { toString: () => string } | string;
        name?: string;
        brand?: string;
        type?: string;
        stability?: string;
        image?: string;
        flight?: { speed?: number; glide?: number; turn?: number; fade?: number };
        addedAt?: Date;
      };
      return {
        _id: typeof discDoc._id === 'string' ? discDoc._id : discDoc._id.toString(),
        name: discDoc.name,
        brand: discDoc.brand,
        type: discDoc.type,
        stability: discDoc.stability,
        image: discDoc.image,
        flight: discDoc.flight,
        addedAt: discDoc.addedAt?.toISOString(),
      };
    }) as DiscType[];
  } catch (error) {
    console.error(`[Brand ${brandName}] Failed to fetch discs:`, error);
    // Return empty array on error - page will still render
    return [];
  }
}

export default async function BrandPage({ params }: { params: Promise<{ brandName: string }> }) {
  const { brandName: brandNameParam } = await params;
  const brandName = decodeURIComponent(brandNameParam);
  const discs = await getBrandDiscs(brandName);
  
  const brandInfo = brandDescriptions[brandName] || {
    description: `Browse ${brandName} disc golf discs. Find drivers, midranges, and putters from this trusted disc golf brand.`,
    keywords: [`${brandName} discs`, `${brandName} disc golf`]
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  const brandUrl = `${baseUrl}/catalog/brand/${encodeURIComponent(brandName)}`;

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${brandName} Disc Golf Discs`,
    description: brandInfo.description,
    url: brandUrl,
    numberOfItems: discs.length,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: discs.slice(0, 10).map((disc, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: disc.name,
          brand: {
            '@type': 'Brand',
            name: disc.brand,
          },
        },
      })),
    },
  };

  return (
    <>
      <StructuredData data={collectionSchema} id="brand-schema" />
      <BrandClient 
        initialDiscs={discs} 
        brandName={brandName}
        brandDescription={brandInfo.description}
      />
    </>
  );
}
