import { NextResponse } from "next/server";
import Listing from "@/models/Listing";
import { connectToDatabase } from "@/lib/mongodb";

// GET listings (with filters)
export async function GET(req: Request) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand");
  const condition = searchParams.get("condition");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "25"); // miles

  const query: any = {};
  if (brand) query.brand = brand;
  if (condition) query.condition = condition;

  // Only include listings near the given location
  if (lat !== 0 && lng !== 0) {
    query.location = {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / 3963.2], // convert miles to radians
      },
    };
  }

  const listings = await Listing.find(query).populate("userId", "name").sort({ createdAt: -1 });
  return NextResponse.json(listings);
}

// POST new listing
export async function POST(req: Request) {
  await connectToDatabase();
  const body = await req.json();
  const newListing = await Listing.create(body);
  return NextResponse.json(newListing, { status: 201 });
}
