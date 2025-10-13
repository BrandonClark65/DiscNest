import { NextResponse } from "next/server";
import Listing from "@/models/Listing";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET listings (only approved, with optional filters)
export async function GET(req: Request) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand");
  const condition = searchParams.get("condition");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "25"); // miles
  const userId = searchParams.get("userId"); // optional: filter by owner
  const excludeUserId = searchParams.get("excludeUserId"); // optional: exclude a specific user

   const query: any = {
    pendingReview: { $ne: true },
    sold: { $ne: true },
  };

  if (brand) query.brand = brand;
  if (condition) query.condition = condition;

  if (userId) query.userId = userId;
  if (excludeUserId) query.userId = { $ne: excludeUserId };

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
  try {
    await connectToDatabase();
    const body = await req.json();

    const pendingReview = body.pendingReview || false;

    const listing = await Listing.create({
      ...body,
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
