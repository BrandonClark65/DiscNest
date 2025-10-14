import { NextResponse } from "next/server";
import Listing from "@/models/Listing";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function reverseGeocode(lat: number, lng: number) {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const res = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`
  );
  const data = await res.json();
  const components = data.results?.[0]?.components || {};
  return {
    city: components.city || components.town || components.village || "",
    state: components.state || "",
  };
}

// GET listings (marketplace or user-specific)
export async function GET(req: Request) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand");
  const condition = searchParams.get("condition");
  const search = searchParams.get("search");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const userId = searchParams.get("excludeUserId"); // current user
  const includeSold = searchParams.get("includeSold") === "true";

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  // Base query
  const query: any = { pendingReview: { $ne: true } };
  if (!includeSold) query.sold = { $ne: true };
  if (brand) query.brand = brand;
  if (condition) query.condition = condition;
  if (userId) query.userId = { $ne: userId }; // exclude current user's listings

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }

  let listings;

  if (lat !== 0 && lng !== 0) {
    // Sort by proximity
    listings = await Listing.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance",
          spherical: true,
          query,
        },
      },
      { $sort: { distance: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
  } else {
    // Sort by createdAt if no location
    listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  // Populate user names
  const userIds = listings.map((l) => l.userId);
  const users = await User.find({ _id: { $in: userIds } }, { _id: 1, name: 1 });
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u.name]));

  listings = listings.map((l) => ({
    ...l,
    userId: { _id: l.userId, name: userMap[l.userId?.toString()] || "Unknown" },
    location: l.location?.coordinates
      ? {
          ...l.location,
          coordinates: [
            l.location.coordinates[0] + (Math.random() - 0.5) * 0.02,
            l.location.coordinates[1] + (Math.random() - 0.5) * 0.02,
          ],
        }
      : l.location,
  }));

  return NextResponse.json(listings);
}
// POST new listing
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const pendingReview = body.pendingReview || false;

    // Reverse geocode coordinates
    let city = "";
    let state = "";
    if (body.location?.coordinates?.length === 2) {
      const [lng, lat] = body.location.coordinates;
      const result = await reverseGeocode(lat, lng);
      city = result.city;
      state = result.state;
    }

    const listing = await Listing.create({
      ...body,
      city,
      state,
      pendingReview,
    });

    if (pendingReview) {
      const user = await User.findById(body.userId);
      await resend.emails.send({
        from: "alerts@yourdomain.com",
        to: process.env.ADMIN_ALERT_EMAIL!,
        subject: `⚠️ Listing from ${user?.name || "Unknown"} requires review`,
        html: `
          <p><strong>User:</strong> ${user?.name} (${user?.email})</p>
          <p><strong>Listing:</strong> ${listing.title}</p>
          <p><strong>Images:</strong> ${body.imageUrls
            .map((url: string) => `<a href="${url}">${url}</a>`)
            .join("<br>")}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        `,
      });
    }

    return NextResponse.json(listing, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
