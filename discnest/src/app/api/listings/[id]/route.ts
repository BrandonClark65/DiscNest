import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Listing from '@/models/Listing';
import type { Listing as ListingType } from '@/types/listing';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();

  try {
    // Next.js requires you to await the params
    const { id } = await params; // <-- the fix

    const listingDoc = await Listing.findById(id).lean();
    if (!listingDoc) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const listing = listingDoc as unknown as ListingType;
    listing._id = listing._id.toString();

    return NextResponse.json({ listing });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
