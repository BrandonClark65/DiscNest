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
    return discs.map((disc) => ({
      _id: disc._id.toString(),
      name: disc.name,
      brand: disc.brand,
      type: disc.type,
      stability: disc.stability,
      image: disc.image,
      flight: disc.flight,
      addedAt: disc.addedAt?.toISOString(),
    })) as DiscType[];
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
