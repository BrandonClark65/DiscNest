import { NextResponse } from "next/server";
import Listing from "@/models/Listing";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: Request) {
  await connectToDatabase();

  // Only fetch listings that are pending review
  const pendingListings = await Listing.find({ pendingReview: true })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  return NextResponse.json({ listings: pendingListings });
}

// Optional: Admin can approve or reject a listing via PATCH
export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { listingId, action } = await req.json(); // action = 'approve' | 'reject'

    if (!listingId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    if (action === "approve") {
      listing.pendingReview = false;
      await listing.save();
    } else if (action === "reject") {
      await listing.deleteOne();
    }

    return NextResponse.json({ success: true, listingId, action });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
