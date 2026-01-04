import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { withErrorHandling } from "@/lib/withErrorHandling";

// ----------------------
// GET: Get all stores (for map and nearby stores banner)
// ----------------------
const getStoresHandler = async (req: Request) => {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);

  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  // Find all users with role "store" and valid location
  const query: {
    role: string;
    storeName?: { $exists: boolean; $ne: null };
    location?: { $exists: boolean };
  } = {
    role: "store",
    storeName: { $exists: true, $ne: null },
  };

  let stores;

  // If lat/lng provided, sort by distance
  if (lat !== 0 && lng !== 0) {
    try {
      // Ensure geo index exists
      try {
        await User.collection.createIndex({ location: "2dsphere" });
      } catch (indexError) {
        // Index might already exist, that's fine
        if ((indexError as { code?: number }).code !== 85) {
          // Code 85 = IndexOptionsConflict, means index already exists
          console.warn("Could not create geo index:", indexError);
        }
      }

      const aggregateResult = await User.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distance",
            spherical: true,
            query: {
              role: "store",
              storeName: { $exists: true, $ne: null },
              location: { $exists: true, $ne: null },
            },
          },
        },
        { $limit: limit },
      ]);

      stores = aggregateResult.map((store) => ({
        _id: store._id.toString(),
        name: store.name,
        storeName: store.storeName,
        location: store.location,
        avatarUrl: store.avatarUrl,
        bio: store.bio,
        city: store.city,
        state: store.state,
        // Convert distance from meters to miles (MongoDB $geoNear returns meters)
        distance: store.distance ? store.distance / 1609.34 : undefined,
      }));
    } catch (geoError) {
      // If geo query fails (e.g., no index), fall back to regular query
      console.warn("Geo query failed, falling back to regular query:", geoError);
      const storeDocs = await User.find(query)
        .select("name storeName location avatarUrl bio city state")
        .limit(limit)
        .lean();

      stores = storeDocs.map((store) => {
        const storeDoc = store as unknown as {
          _id: { toString: () => string } | string;
          name?: string;
          storeName?: string;
          location?: { coordinates?: [number, number] };
          avatarUrl?: string;
          bio?: string;
          city?: string;
          state?: string;
        };

        return {
          _id: typeof storeDoc._id === "string" ? storeDoc._id : storeDoc._id.toString(),
          name: storeDoc.name,
          storeName: storeDoc.storeName,
          location: storeDoc.location,
          avatarUrl: storeDoc.avatarUrl,
          bio: storeDoc.bio,
          city: storeDoc.city,
          state: storeDoc.state,
        };
      });
    }
  } else {
    // No location provided, just get all stores
    const storeDocs = await User.find(query)
      .select("name storeName location avatarUrl bio city state")
      .limit(limit)
      .lean();

    stores = storeDocs.map((store) => {
      const storeDoc = store as unknown as {
        _id: { toString: () => string } | string;
        name?: string;
        storeName?: string;
        location?: { coordinates?: [number, number] };
        avatarUrl?: string;
        bio?: string;
        city?: string;
        state?: string;
      };

      return {
        _id: typeof storeDoc._id === "string" ? storeDoc._id : storeDoc._id.toString(),
        name: storeDoc.name,
        storeName: storeDoc.storeName,
        location: storeDoc.location,
        avatarUrl: storeDoc.avatarUrl,
        bio: storeDoc.bio,
        city: storeDoc.city,
        state: storeDoc.state,
      };
    });
  }

  return NextResponse.json({ stores });
};

export const GET = withErrorHandling(
  getStoresHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/stores"
);

