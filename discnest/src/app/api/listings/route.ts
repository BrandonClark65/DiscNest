import { NextResponse } from "next/server";
import Listing from "@/models/Listing";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { Resend } from "resend";
import mongoose from "mongoose";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { requireUser } from "@/lib/auth/requireUser";

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

// ----------------------
// GET: marketplace or myListings
// ----------------------
const getListingsHandler = async (req: Request) => {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("mode"); // 'marketplace' | 'myListings'
  const brand = searchParams.get("brand");
  const condition = searchParams.get("condition");
  const search = searchParams.get("search");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  let sessionUserId: string | null = null;

  // Only require login for "myListings"
  if (mode === "myListings") {
    try {
      const session = await requireUser();
      sessionUserId = session.user.id;
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const query: any = { pendingReview: { $ne: true } };

  if (mode === "marketplace") {
    // Exclude current user's listings if logged in
    if (sessionUserId) {
      query.userId = { $ne: new mongoose.Types.ObjectId(sessionUserId) };
    }
    query.sold = { $ne: true };
  } else if (mode === "myListings") {
    // Show only this user's listings
    if (sessionUserId) {
      query.userId = new mongoose.Types.ObjectId(sessionUserId);
    }
  }

  if (brand) query.brand = brand;
  if (condition) query.condition = condition;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }

  let listings: any[] = [];
  let totalCount = 0;

  // Geo sorting only for marketplace
  if (lat !== 0 && lng !== 0 && mode === "marketplace") {
    const aggregateResult = await Listing.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance",
          spherical: true,
          query,
        },
      },
      { $sort: { distance: 1, createdAt: -1 } },
    ]);

    totalCount = aggregateResult.length;
    const paginated = aggregateResult.slice(skip, skip + limit);
    const listingIds = paginated.map((r) => r._id);
    listings = await Listing.find({ _id: { $in: listingIds } }).lean();
  } else {
    totalCount = await Listing.countDocuments(query);
    listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
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

  const totalPages = Math.ceil(totalCount / limit);

  return NextResponse.json({ listings, totalPages, totalCount });
};

export const GET = withErrorHandling(getListingsHandler, "/api/listings");

// ----------------------
// POST: create listing (auth required)
// ----------------------
const createListingHandler = async (req: Request, session: any) => {
  await connectToDatabase();
  const body = await req.json();
  const pendingReview = body.pendingReview || false;

  let city = body.city || "";
  let state = body.state || "";

  if ((!city || !state) && body.location?.coordinates?.length === 2) {
    try {
      const [lng, lat] = body.location.coordinates;
      const result = await reverseGeocode(lat, lng);
      city = city || result.city;
      state = state || result.state;
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
  }

  const listing = await Listing.create({
    ...body,
    userId: session.user.id,
    weight:
      body.weight !== undefined && body.weight !== null
        ? Number(body.weight)
        : null,
    city,
    state,
    pendingReview,
    createdAt: new Date(),
  });

  if (pendingReview) {
    const user = await User.findById(session.user.id);
    const fromEmail = process.env.FROM_ALERT_EMAIL || "alerts@discnest.com";
    await resend.emails.send({
      from: fromEmail,
      to: process.env.ADMIN_EMAIL!,
      subject: `⚠️ Listing from ${user?.name || "Unknown"} requires review`,
      html: `
        <p><strong>User:</strong> ${user?.name} (${user?.email})</p>
        <p><strong>Listing:</strong> ${listing.title}</p>
        <p><strong>Images:</strong> ${
          body.imageUrls
            ?.map((url: string) => `<a href="${url}">${url}</a>`)
            .join("<br>") || "None"
        }</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `,
    });
  }

  return NextResponse.json(listing, { status: 201 });
};

export const POST = withErrorHandling(
  withUserAuth(createListingHandler),
  "/api/listings"
);
