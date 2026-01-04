import { connectToDatabase } from '@/lib/mongodb';
import Listing from '@/models/Listing';
import User from '@/models/User';
import type { ListingAdmin as ListingType } from '@/types/listing';
import MarketplaceClient from './MarketplaceClient';
import StructuredData from '@/components/StructuredData';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

async function getMarketplaceListings(): Promise<{ listings: ListingType[]; totalCount: number }> {
  try {
    await connectToDatabase();
    
    // Get session to exclude user's own listings if logged in
    let sessionUserId: string | null = null;
    try {
      const nextAuth = await import('next-auth') as unknown as { 
        getServerSession: (options: typeof authOptions) => Promise<{ user?: { id?: string } } | null> 
      };
      const { getServerSession } = nextAuth;
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        sessionUserId = session.user.id;
      }
    } catch {
      // If session check fails, just continue without excluding user listings
      // (user might not be logged in, which is fine)
    }
    
    // Fetch first page of marketplace listings (same query as API endpoint)
    const query: {
      pendingReview?: { $ne: boolean };
      sold?: { $ne: boolean };
      userId?: { $ne: mongoose.Types.ObjectId };
    } = {
      pendingReview: { $ne: true },
      sold: { $ne: true },
    };
    
    // Exclude current user's listings if logged in (same as API endpoint)
    if (sessionUserId) {
      query.userId = { $ne: new mongoose.Types.ObjectId(sessionUserId) };
    }

    const limit = 20;
    // Use the same query for count to exclude user's listings
    const totalCount = await Listing.countDocuments(query);
    
    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Populate user names and rating data
    const userIds = listings.map((l) => l.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name username avatarUrl averageRating ratingCount')
      .lean();
    const userMap: Record<string, {
      name?: string;
      username?: string;
      avatarUrl?: string;
      averageRating?: number | null;
      ratingCount?: number;
    }> = {};
    users.forEach((u) => {
      const userDoc = u as unknown as {
        _id: { toString: () => string } | string;
        name?: string;
        username?: string;
        avatarUrl?: string;
        averageRating?: number | null;
        ratingCount?: number;
      };
      const userId = typeof userDoc._id === 'string' ? userDoc._id : userDoc._id.toString();
      userMap[userId] = {
        name: userDoc.name,
        username: userDoc.username,
        avatarUrl: userDoc.avatarUrl,
        averageRating: userDoc.averageRating ?? null,
        ratingCount: userDoc.ratingCount ?? 0,
      };
    });

    // Format listings to match ListingType
    const formattedListings = listings.map((l) => {
      const listingDoc = l as unknown as {
        _id: { toString: () => string } | string;
        userId: { _id: unknown } | string | unknown;
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
      };
      
      const listingId = typeof listingDoc._id === 'string' 
        ? listingDoc._id 
        : listingDoc._id.toString();
      
      const userId = typeof listingDoc.userId === 'object' && listingDoc.userId !== null && '_id' in listingDoc.userId
        ? (listingDoc.userId as { _id: unknown })._id
        : listingDoc.userId;
      const userIdString = typeof userId === 'string' ? userId : (userId as { toString: () => string })?.toString() || '';
      
      const userInfo = userMap[userIdString] || { name: 'Unknown' };
      return {
        _id: listingId,
        userId: {
          _id: userIdString,
          name: userInfo.name || 'Unknown',
          username: userInfo.username,
          avatarUrl: userInfo.avatarUrl,
          averageRating: userInfo.averageRating ?? null,
          ratingCount: userInfo.ratingCount ?? 0,
        },
        title: listingDoc.title,
        description: listingDoc.description,
        brand: listingDoc.brand,
        condition: listingDoc.condition as ListingType['condition'],
        type: listingDoc.type as ListingType['type'],
        price: listingDoc.price,
        imageUrls: listingDoc.imageUrls || [],
        publicIds: listingDoc.publicIds,
        location: listingDoc.location?.coordinates
          ? {
              coordinates: listingDoc.location.coordinates,
            }
          : listingDoc.location,
        city: listingDoc.city,
        state: listingDoc.state,
        radiusVisibility: listingDoc.radiusVisibility,
        createdAt: listingDoc.createdAt?.toISOString(),
        pendingReview: listingDoc.pendingReview,
        plastic: listingDoc.plastic,
        sold: listingDoc.sold,
        weight: listingDoc.weight,
      };
    }) as ListingType[];

    return {
      listings: formattedListings,
      totalCount,
    };
  } catch (error) {
    console.error('[Marketplace] Failed to fetch listings:', error);
    // Return empty on error - page will still render
    return { listings: [], totalCount: 0 };
  }
}

export default async function MarketplacePage() {
  const { listings, totalCount } = await getMarketplaceListings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Disc Golf Marketplace - Used Disc Golf Discs Buy & Sell',
    description: `Buy and sell used disc golf discs in our marketplace. Browse ${totalCount} active listings from players nationwide.`,
    url: `${baseUrl}/marketplace`,
    numberOfItems: totalCount,
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
      <StructuredData data={itemListSchema} id="marketplace-schema" />
      <MarketplaceClient initialListings={listings} initialTotalCount={totalCount} />
    </>
  );
}
