import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';
import type { Disc as DiscType } from '@/types/disc';
import CatalogClient from './CatalogClient';
import StructuredData from '@/components/StructuredData';

async function getDiscs(): Promise<DiscType[]> {
  try {
    await connectToDatabase();
    
    // Fetch discs server-side (same query as API endpoint)
    const discs = await Disc.find(
      { userId: { $exists: false } },
      'name brand type addedAt image stability flight'
    )
      .sort({ brand: 1, name: 1 }) // Sort by brand, then name for consistent ordering
      .lean();

    // Convert MongoDB documents to plain objects with proper typing
    return discs.map((disc) => {
      // Type assertion for lean() result - _id can be ObjectId or string
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
    console.error('[Catalog] Failed to fetch discs:', error);
    // Return empty array on error - page will still render
    return [];
  }
}

export default async function CatalogPage() {
  const discs = await getDiscs();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Disc Golf Catalog',
    description: `Browse our comprehensive catalog of ${discs.length} disc golf discs from top brands`,
    url: `${baseUrl}/catalog`,
    numberOfItems: discs.length,
  };

  return (
    <>
      <StructuredData data={collectionSchema} id="catalog-schema" />
      <CatalogClient initialDiscs={discs} />
    </>
  );
}
