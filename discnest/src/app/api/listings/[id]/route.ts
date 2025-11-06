import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Listing from "@/models/Listing";
import type { Listing as ListingType } from "@/types/listing";
import { v2 as cloudinary } from "cloudinary";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";

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

  return NextResponse.json({ listing });
};

export const GET = withErrorHandling(getListingHandler, "/api/listing/[id]");

// ----------------------
// PATCH: mark as sold
// ----------------------
const patchListingHandler = async (
  req: Request,
  session: any,
  context?: { params: Promise<{ id: string }> } // ✅ optional now
) => {
  if (!context?.params)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { id } = await context.params;
  if (!id)
    return NextResponse.json({ error: "Missing listing ID" }, { status: 400 });

  const { action } = await req.json();
  if (action !== "markSold")
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

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

  listing.sold = true;
  listing.markModified("sold");
  await listing.save();

  return NextResponse.json({ listing });
};

export const PATCH = withErrorHandling(
  withUserAuth(patchListingHandler),
  "/api/listing/[id]"
);

// ----------------------
// DELETE: remove listing
// ----------------------
const deleteListingHandler = async (
  req: Request,
  session: any,
  context?: { params: Promise<{ id: string }> }
) => {
  await connectToDatabase();

  if (!context?.params)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { id } = await context.params;
  if (!id)
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
  const imagesToDelete = listing.publicIds?.length
    ? listing.publicIds
    : listing.imageUrls || [];

  for (const item of imagesToDelete) {
    try {
      let publicId = item;
      if (!listing.publicIds && typeof item === "string") {
            const match = item.match(/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
        publicId = match ? match[1] : null;
      }
      if (publicId) await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn("⚠️ Failed to delete Cloudinary image:", err);
    }
  }

  await listing.deleteOne();
  return NextResponse.json({ message: "Listing deleted successfully" });
};

export const DELETE = withErrorHandling(
  withUserAuth(deleteListingHandler),
  "/api/listing/[id]"
);
