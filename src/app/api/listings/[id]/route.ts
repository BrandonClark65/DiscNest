import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Listing from "@/models/Listing";
import User from "@/models/User";
import type { Listing as ListingType } from "@/types/listing";
import { v2 as cloudinary } from "cloudinary";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { addSystemMessageToThreads } from "@/lib/messages/addSystemMessageToThreads";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ----------------------
// GET: fetch a listing
// ----------------------
const getListingHandler = async (
  req: Request,
  context: { params: Promise<{ id: string }> }
) => {
  await connectToDatabase();

  const { id } = await context.params;
  const listingDoc = await Listing.findById(id).lean();

  if (!listingDoc)
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const listing = listingDoc as unknown as ListingType;
  listing._id = listing._id.toString();

  // If listing owner is a store with a location, use store's location for the map
  const listingDocTyped = listingDoc as unknown as {
    userId: { _id?: unknown; toString?: () => string } | string | { toString: () => string };
  };
  
  let userId: string | null = null;
  if (typeof listingDocTyped.userId === 'string') {
    userId = listingDocTyped.userId;
  } else if (listingDocTyped.userId && typeof listingDocTyped.userId === 'object') {
    if ('_id' in listingDocTyped.userId && listingDocTyped.userId._id) {
      userId = typeof listingDocTyped.userId._id === 'string' 
        ? listingDocTyped.userId._id 
        : (listingDocTyped.userId._id as { toString: () => string }).toString();
    } else if ('toString' in listingDocTyped.userId && typeof listingDocTyped.userId.toString === 'function') {
      userId = listingDocTyped.userId.toString();
    }
  }

  let isStoreListing = false;
  if (userId) {
    const user = await User.findById(userId).lean() as {
      role?: string;
      location?: { coordinates?: [number, number] };
    } | null;
    if (user && user.role === 'store' && user.location?.coordinates) {
      // Override listing location with store location for display
      listing.location = {
        coordinates: user.location.coordinates as [number, number],
      };
      isStoreListing = true;
    }
  }

  return NextResponse.json({ listing, isStoreListing });
};

export const GET = withErrorHandling(
  getListingHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/listing/[id]"
);

// ----------------------
// PATCH: update listing or mark as sold
// ----------------------
import type { Session } from "next-auth";

const patchListingHandler = async (
  req: Request,
  session: Session,
  context?: { params?: Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { id } = context.params;
  if (!id || typeof id !== "string")
    return NextResponse.json({ error: "Missing listing ID" }, { status: 400 });

  const body = await req.json();
  
  const listing = await Listing.findById(id);
  if (!listing)
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Ownership check
  const listingUserId =
    typeof listing.userId === "string"
      ? listing.userId
      : listing.userId._id.toString();

  if (listingUserId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Handle "markSold" action
  if (body.action === "markSold") {
    listing.sold = true;
    listing.markModified("sold");
    await listing.save();

    // Add system message to all threads connected to this listing
    await addSystemMessageToThreads(
      id,
      "This listing has been marked as SOLD by the seller."
    );

    return NextResponse.json({ listing });
  }

  // Handle full update (no action field)
  // Update allowed fields
  const allowedFields = [
    'title',
    'description',
    'brand',
    'plastic',
    'weight',
    'color',
    'condition',
    'type',
    'price',
    'city',
    'state',
    'location',
    'imageUrls',
    'publicIds',
    'listingType',
  ];

  allowedFields.forEach((field) => {
    if (field in body) {
      if (field === 'location' && body[field]) {
        listing[field] = body[field];
      } else if (field === 'imageUrls' || field === 'publicIds') {
        listing[field] = body[field];
      } else if (field === 'weight' && body[field] !== null && body[field] !== undefined) {
        listing[field] = body[field];
      } else if (field !== 'weight') {
        listing[field] = body[field];
      }
    }
  });

  // For group listings, ensure single-disc fields are cleared
  if (listing.listingType === 'group') {
    listing.condition = undefined;
    listing.plastic = undefined;
    listing.weight = undefined;
    listing.color = undefined;
    listing.price = undefined;
  }

  await listing.save();

  const updatedListing = await Listing.findById(id).lean();
  const listingResult = updatedListing as unknown as ListingType;
  listingResult._id = listingResult._id.toString();

  return NextResponse.json({ listing: listingResult });
};

export const PATCH = withErrorHandling(
  withUserAuth(patchListingHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/listing/[id]"
);

// ----------------------
// DELETE: remove listing
// ----------------------
const deleteListingHandler = async (
  req: Request,
  session: Session,
  context?: { params?: Record<string, unknown> }
) => {
  await connectToDatabase();

  if (!context?.params)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { id } = context.params;

  if (!id || typeof id !== "string")
    return NextResponse.json({ error: "Missing listing ID" }, { status: 400 });

  const listing = await Listing.findById(id);
  if (!listing)
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Ownership check
  const listingUserId =
    typeof listing.userId === "string"
      ? listing.userId
      : listing.userId._id.toString();

  if (listingUserId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete images from Cloudinary
  const hasPublicIds = listing.publicIds && listing.publicIds.length > 0;
  const imagesToDelete = hasPublicIds
    ? listing.publicIds
    : listing.imageUrls || [];

  for (const item of imagesToDelete) {
    try {
      let publicId: string | null = null;

      if (hasPublicIds) {
        // Use publicIds directly
        publicId = typeof item === "string" ? item : null;
      } else if (typeof item === "string") {
        // Extract publicId from Cloudinary URL
        const match = item.match(/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
        publicId = match ? match[1] : null;
      }

      if (publicId) await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn("⚠️ Failed to delete Cloudinary image:", err);
    }
  }

  await listing.deleteOne();

  // 🔥 NEW: Add system message to all threads connected to this listing
  await addSystemMessageToThreads(
    id,
    "This listing has been deleted by the seller."
  );

  return NextResponse.json({ message: "Listing deleted successfully" });
};

export const DELETE = withErrorHandling(
  withUserAuth(deleteListingHandler) as (...args: unknown[]) => Promise<NextResponse>,
  "/api/listing/[id]"
);
