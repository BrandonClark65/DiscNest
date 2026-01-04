import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import { withErrorHandling } from "@/lib/withErrorHandling";
import mongoose from "mongoose";

// ----------------------
// GET: Get store by storeName with all listings
// ----------------------
const getStoreHandler = async (
  req: Request,
  context: { params: Promise<{ storeName: string }> }
) => {
  await connectToDatabase();

  const { storeName: storeNameParam } = await context.params;
  const storeName = storeNameParam.toLowerCase().trim();

  // Find store by storeName
  const store = await User.findOne({
    role: "store",
    storeName: storeName,
  }).lean();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
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
  };

  const storeId = typeof storeDoc._id === "string" 
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

  // Format listings
  const formattedListings = listings.map((listing) => {
    const listingDoc = listing as unknown as {
      _id: { toString: () => string } | string;
      title: string;
      description?: string;
      brand?: string;
      condition: string;
      type: string;
      price?: number;
      imageUrls: string[];
      location?: { coordinates?: [number, number] };
      city?: string;
      state?: string;
      createdAt?: Date;
      plastic?: string;
      weight?: number;
      color?: string;
    };

    return {
      _id: typeof listingDoc._id === "string" 
        ? listingDoc._id 
        : listingDoc._id.toString(),
      title: listingDoc.title,
      description: listingDoc.description,
      brand: listingDoc.brand,
      condition: listingDoc.condition,
      type: listingDoc.type,
      price: listingDoc.price,
      imageUrls: listingDoc.imageUrls || [],
      location: listingDoc.location,
      city: listingDoc.city,
      state: listingDoc.state,
      createdAt: listingDoc.createdAt?.toISOString(),
      plastic: listingDoc.plastic,
      weight: listingDoc.weight,
      color: listingDoc.color,
    };
  });

  return NextResponse.json({
    store: {
      _id: storeId,
      name: storeDoc.name,
      storeName: storeDoc.storeName,
      location: storeDoc.location,
      avatarUrl: storeDoc.avatarUrl,
      bio: storeDoc.bio,
      city: storeDoc.city,
      state: storeDoc.state,
    },
    listings: formattedListings,
    listingCount: formattedListings.length,
  });
};

export const GET = withErrorHandling(
  getStoreHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/stores/[storeName]"
);

