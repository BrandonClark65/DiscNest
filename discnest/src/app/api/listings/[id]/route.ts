import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // your NextAuth options
import { connectToDatabase } from '@/lib/mongodb';
import Listing from '@/models/Listing';
import type { Listing as ListingType } from '@/types/listing';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();

  try {
    const { id } = params;
    const listingDoc = await Listing.findById(id).lean();
    if (!listingDoc) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const listing = listingDoc as unknown as ListingType;
    listing._id = listing._id.toString();

    return NextResponse.json({ listing });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH: mark as sold
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> } // 👈 must use Promise type
) {
  const { action } = await req.json();

  if (action === "markSold") {
    await connectToDatabase();

    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      // ✅ Await params before accessing id
      const { id } = await context.params;

      const listing = await Listing.findById(id);
      if (!listing)
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });

      // Check ownership
      const listingUserId =
        typeof listing.userId === "string"
          ? listing.userId
          : listing.userId._id.toString();

      if (listingUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

    listing.sold = true;
    listing.markModified("sold"); // ✅ force Mongoose to recognize the change
    try {
    await listing.save();
    console.log("✅ Listing marked as sold:", listing._id);
    } catch (err) {
    console.error("❌ Error saving listing:", err);
    }



      return NextResponse.json({ listing });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}


// DELETE: remove listing + image from Cloudinary
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const listing = await Listing.findById(id);
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    // Check ownership
    const listingUserId = typeof listing.userId === 'string' ? listing.userId : listing.userId._id.toString();
    if (listingUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete images from Cloudinary if they exist
    if (listing.imageUrls && listing.imageUrls.length > 0) {
      for (const url of listing.imageUrls) {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        const publicId = lastPart.split('.')[0]; // simple extraction
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
    }

    await listing.deleteOne();

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
