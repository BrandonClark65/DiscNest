import { NextResponse } from "next/server";
import Listing from "@/models/Listing";
import { connectToDatabase } from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";

export const GET = withAdminAuth(async () => {
  await connectToDatabase();

  const pendingListings = await Listing.find({ pendingReview: true })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  return NextResponse.json({ listings: pendingListings });
});

export const PATCH = withAdminAuth(async (req) => {
  await connectToDatabase();

  const { listingId, action } = await req.json();
  if (!listingId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const listing = await Listing.findById(listingId);
  if (!listing)
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  if (action === "approve") {
    listing.pendingReview = false;
    await listing.save();
  } else if (action === "reject") {
    await listing.deleteOne();
  }

  return NextResponse.json({ success: true, listingId, action });
});
