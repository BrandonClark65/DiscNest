// src/app/api/requests/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DiscRequest from "@/models/DiscRequest";
import { withUserAuth } from "@/lib/auth/withUserAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import type { PipelineStage } from "mongoose";

//
// GET — fetch disc requests (optionally sorted by distance)
//
const GET_handler = async (req: Request) => {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusKm = Number(searchParams.get("radiusKm") ?? 250);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const skip = (page - 1) * limit;

  // If lat/lng are provided → geoNear
  if (lat && lng) {
    const latitude = Number(lat);
    const longitude = Number(lng);

    const pipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distanceMeters",
          maxDistance: radiusKm * 1000,
          spherical: true,
        },
      },

      // 🔍 Populate userId manually
      {
        $lookup: {
          from: "users",              // collection name
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      // Flatten array → object
      { $unwind: "$user" },

      // Optional: pick only needed fields
      {
        $project: {
          title: 1,
          description: 1,
          brand: 1,
          plastic: 1,
          weight: 1,
          condition: 1,
          location: 1,
          distanceMeters: 1,
          createdAt: 1,
          // Attach populated user fields
          userId: {
            _id: "$user._id",
            name: "$user.name",
            avatarUrl: "$user.avatarUrl",
            username: "$user.username",
          },
        },
      },

      { $sort: { distanceMeters: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];


    const results = await DiscRequest.aggregate(pipeline);

    return NextResponse.json({
      requests: results,
      page,
      limit,
    });
  }

  // Fallback to latest
  const requests = await DiscRequest.find({})
    .populate("userId", "name avatarUrl username")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();


  return NextResponse.json({ requests, page, limit });
};

export const GET = withErrorHandling(
  GET_handler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/requests"
);


//
// POST — create a disc request (Authenticated)
//
const POST_handler = withUserAuth(async (req, session) => {
  await connectToDatabase();
  const body = await req.json();

  const {
    title,
    description,
    brand,
    plastic,
    weight,
    color,
    condition,
    latitude,
    longitude,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "Location (latitude & longitude) is required" },
      { status: 400 }
    );
  }

  // Remove brand and plastic if they're empty strings (not valid enum values)
  const requestData: {
    userId: string;
    title: string;
    description?: string;
    brand?: string;
    plastic?: string;
    weight?: number;
    color?: string;
    condition?: string;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
  } = {
    userId: session.user.id,
    title,
    description,
    weight,
    color,
    condition,
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
  };

  // Only include brand and plastic if they're not empty strings
  if (brand && brand.trim() !== "") {
    requestData.brand = brand;
  }
  if (plastic && plastic.trim() !== "") {
    requestData.plastic = plastic;
  }

  const doc = await DiscRequest.create(requestData);

  return NextResponse.json(doc, { status: 201 });
});

export const POST = withErrorHandling(
  POST_handler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/requests"
);
