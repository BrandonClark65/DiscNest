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

    // ⭐ FIX: Type the pipeline as PipelineStage[]
    const pipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distanceMeters",
          maxDistance: radiusKm * 1000,
          spherical: true,
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
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return NextResponse.json({ requests, page, limit });
};

export const GET = withErrorHandling(GET_handler, "/api/requests");


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

  const doc = await DiscRequest.create({
    userId: session.user.id,
    title,
    description,
    brand,
    plastic,
    weight,
    color,
    condition,
    location: {
      type: "Point",
          coordinates: [longitude, latitude],
    },
  });

  return NextResponse.json(doc, { status: 201 });
});

export const POST = withErrorHandling(POST_handler, "/api/requests");
