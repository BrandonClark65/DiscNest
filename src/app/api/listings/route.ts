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
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  interface ListingQuery {
    pendingReview?: { $ne: boolean };
    userId?: { $ne: mongoose.Types.ObjectId } | mongoose.Types.ObjectId;
    sold?: { $ne: boolean };
    brand?: string;
    condition?: string;
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
  }

  const query: ListingQuery = { pendingReview: { $ne: true } };

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

  interface ListingDocument {
    _id: unknown;
    userId: unknown;
    location?: {
      coordinates: [number, number];
    };
    [key: string]: unknown;
  }

  let listings: ListingDocument[] = [];
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
import type { UserSession } from "@/types/api";

const createListingHandler = async (req: Request, session: UserSession) => {
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

  interface ListingData {
    userId: string;
    weight: number | null;
    [key: string]: unknown;
  }

  const listingData: ListingData = {
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
  };

  // Remove plastic if it's an empty string (not a valid enum value)
  if (listingData.plastic === "") {
    delete listingData.plastic;
  }

  // Remove location if it doesn't have valid coordinates (geo index requires coordinates)
  if (listingData.location) {
    if (!listingData.location.coordinates || listingData.location.coordinates.length !== 2) {
      delete listingData.location;
    }
  }
  
  // Explicitly set location to undefined if it was removed to prevent model defaults
  if (!listingData.location) {
    listingData.location = undefined;
  }

  const listing = await Listing.create(listingData);

  if (pendingReview) {
    try {
      const user = await User.findById(session.user.id);
      // Use FROM_ALERT_EMAIL if set, otherwise use RESEND_FROM_PROD/DEV based on environment
      const fromEmail = process.env.FROM_ALERT_EMAIL || 
        (process.env.NODE_ENV === "production"
          ? process.env.RESEND_FROM_PROD
          : process.env.RESEND_FROM_DEV);
      
      const adminEmail = process.env.ADMIN_EMAIL;
      
      // Only send email if both from and to emails are configured
      if (fromEmail && adminEmail) {
        await resend.emails.send({
          from: fromEmail,
          to: adminEmail,
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
      } else {
        // Log warning but don't fail listing creation
        console.error('⚠️ Cannot send listing review alert: FROM_ALERT_EMAIL/RESEND_FROM_PROD/RESEND_FROM_DEV or ADMIN_EMAIL not configured');
      }
    } catch (emailError) {
      // Log error but don't fail listing creation
      console.error('⚠️ Failed to send listing review alert email:', emailError);
    }
  }

  return NextResponse.json(listing, { status: 201 });
};

export const POST = withErrorHandling(
  withUserAuth(createListingHandler),
  "/api/listings"
);
