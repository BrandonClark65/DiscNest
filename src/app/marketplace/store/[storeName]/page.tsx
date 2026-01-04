import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Listing from '@/models/Listing';
import type { ListingAdmin as ListingType } from '@/types/listing';
import StorePageClient from './StorePageClient';
import StructuredData from '@/components/StructuredData';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import type { Metadata } from 'next';

async function getStoreData(storeName: string): Promise<{
  store: {
    _id: string;
    name?: string;
    storeName?: string;
    location?: { coordinates: [number, number] };
    avatarUrl?: string;
    bio?: string;
    city?: string;
    state?: string;
    averageRating: number | null;
    ratingCount: number;
  };
  listings: ListingType[];
  listingCount: number;
} | null> {
  try {
    await connectToDatabase();

    const normalizedStoreName = storeName.toLowerCase().trim();

    // Find store by storeName
    const store = await User.findOne({
      role: 'store',
      storeName: normalizedStoreName,
    }).lean();

    if (!store) {
      return null;
    }

    const storeDoc = store as unknown as {
      _id: { toString: () => string } | string;
      name?: string;
      storeName?: string;
      location?: { coordinates?: [number, number] };
      avatarUrl?: string;
      bio?: string;
      city?: string;
      state?: string;
      averageRating?: number | null;
      ratingCount?: number;
    };

    const storeId = typeof storeDoc._id === 'string' 
      ? storeDoc._id 
      : storeDoc._id.toString();

    // Get all active listings for this store
    const listings = await Listing.find({
      userId: new mongoose.Types.ObjectId(storeId),
      pendingReview: { $ne: true },
      sold: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Format listings to match ListingType
    // For store listings, use store's location for all listings
    const formattedListings = listings.map((listing) => {
      const listingDoc = listing as unknown as {
        _id: { toString: () => string } | string;
        userId: unknown;
        title: string;
        description?: string;
        brand?: string;
        condition: string;
        type: string;
        price?: number;
        imageUrls: string[];
        publicIds?: string[];
        location?: { coordinates?: [number, number] };
        city?: string;
        state?: string;
        radiusVisibility?: number;
        createdAt?: Date;
        pendingReview?: boolean;
        plastic?: string;
        sold?: boolean;
        weight?: number;
        color?: string;
      };

      const listingId = typeof listingDoc._id === 'string' 
        ? listingDoc._id 
        : listingDoc._id.toString();

      // Use store's location for all listings (store listings show at store location)
      const listingLocation = storeDoc.location?.coordinates
        ? { coordinates: storeDoc.location.coordinates }
        : listingDoc.location?.coordinates
        ? { coordinates: listingDoc.location.coordinates }
        : undefined;

      return {
        _id: listingId,
        userId: {
          _id: storeId,
          name: storeDoc.name || 'Unknown',
        },
        title: listingDoc.title,
        description: listingDoc.description,
        brand: listingDoc.brand,
        condition: listingDoc.condition as ListingType['condition'],
        type: listingDoc.type as ListingType['type'],
        price: listingDoc.price,
        imageUrls: listingDoc.imageUrls || [],
        publicIds: listingDoc.publicIds,
        location: listingLocation,
        city: listingDoc.city || storeDoc.city,
        state: listingDoc.state || storeDoc.state,
        radiusVisibility: listingDoc.radiusVisibility,
        createdAt: listingDoc.createdAt?.toISOString(),
        pendingReview: listingDoc.pendingReview,
        plastic: listingDoc.plastic,
        sold: listingDoc.sold,
        weight: listingDoc.weight,
        color: listingDoc.color,
      };
    }) as ListingType[];

    return {
      store: {
        _id: storeId,
        name: storeDoc.name,
        storeName: storeDoc.storeName,
        location: storeDoc.location?.coordinates
          ? { coordinates: storeDoc.location.coordinates }
          : undefined,
        avatarUrl: storeDoc.avatarUrl,
        bio: storeDoc.bio,
        city: storeDoc.city,
        state: storeDoc.state,
        averageRating: storeDoc.averageRating ?? null,
        ratingCount: storeDoc.ratingCount ?? 0,
      },
      listings: formattedListings,
      listingCount: formattedListings.length,
    };
  } catch (error) {
    console.error('[Store Page] Failed to fetch store data:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ storeName: string }> }): Promise<Metadata> {
  const { storeName } = await params;
  const storeData = await getStoreData(storeName);
  
  if (!storeData) {
    return {
      title: 'Store Not Found | DiscNest',
    };
  }

  const { store, listingCount } = storeData;
  const storeDisplayName = store.name || store.storeName || 'Store';
  const description = store.bio 
    ? `${store.bio} Browse ${listingCount} disc golf disc${listingCount !== 1 ? 's' : ''} for sale.`
    : `Browse ${listingCount} disc golf disc${listingCount !== 1 ? 's' : ''} for sale at ${storeDisplayName}.`;

  return {
    title: `${storeDisplayName} - Disc Golf Store | DiscNest`,
    description,
    openGraph: {
      title: `${storeDisplayName} - Disc Golf Store`,
      description,
      type: 'website',
      ...(store.avatarUrl && { images: [{ url: store.avatarUrl }] }),
    },
    twitter: {
      card: 'summary',
      title: `${storeDisplayName} - Disc Golf Store`,
      description,
      ...(store.avatarUrl && { images: [store.avatarUrl] }),
    },
  };
}

export default async function StorePage({ params }: { params: Promise<{ storeName: string }> }) {
  const { storeName } = await params;
  const storeData = await getStoreData(storeName);

  if (!storeData) {
    notFound();
  }

  const { store, listings, listingCount } = storeData;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  const storeDisplayName = store.name || store.storeName || 'Store';

  // Structured data for SEO
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: storeDisplayName,
    description: store.bio || `Disc golf store with ${listingCount} active listings`,
    url: `${baseUrl}/marketplace/store/${store.storeName}`,
    ...(store.location?.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: store.location.coordinates[1],
        longitude: store.location.coordinates[0],
      },
    }),
    ...(store.avatarUrl && { image: store.avatarUrl }),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${storeDisplayName} - Disc Golf Listings`,
    description: `Browse ${listingCount} disc golf discs for sale at ${storeDisplayName}`,
    url: `${baseUrl}/marketplace/store/${store.storeName}`,
    numberOfItems: listingCount,
    itemListElement: listings.slice(0, 10).map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: listing.title,
        description: listing.description || 'Disc golf disc for sale',
        brand: listing.brand ? { '@type': 'Brand', name: listing.brand } : undefined,
        offers: listing.price ? {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: 'USD',
          availability: listing.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        } : undefined,
        url: `${baseUrl}/listing/${listing._id}`,
      },
    })),
  };

  return (
    <>
      <StructuredData data={storeSchema} id="store-schema" />
      <StructuredData data={itemListSchema} id="store-listings-schema" />
      <StorePageClient store={store} initialListings={listings} initialListingCount={listingCount} />
    </>
  );
}

