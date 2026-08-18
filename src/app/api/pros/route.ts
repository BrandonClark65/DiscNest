import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ProPlayer from "@/models/ProPlayer";
import { withErrorHandling } from "@/lib/withErrorHandling";

/**
 * The pro list is identical for every visitor and changes at most monthly, so
 * it is cached hard at the edge. This is the deliberate opposite of the
 * no-store used on the per-user handicap routes - nothing here is personal.
 */
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

type ProDoc = {
  _id: { toString(): string };
  slug: string;
  name: string;
  division: string;
  rating: number;
  previousRating?: number;
  ratingUpdatedAt?: Date;
  lastSyncedAt?: Date;
  blurb?: string;
  featured?: boolean;
  displayOrder?: number;
  history?: Array<{ rating: number; effectiveDate: Date }>;
};

/**
 * GET /api/pros
 *
 * Public list of active pros for the handicap comparison. Returns only
 * display-safe fields - never manualOverride or sync internals.
 */
const listProsHandler = async (): Promise<NextResponse> => {
  await connectToDatabase();

  const docs = await ProPlayer.find({ active: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean<ProDoc[]>();

  const pros = docs.map((doc) => ({
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    division: doc.division,
    rating: doc.rating,
    previousRating: doc.previousRating ?? null,
    ratingUpdatedAt: doc.ratingUpdatedAt
      ? new Date(doc.ratingUpdatedAt).toISOString()
      : null,
    lastSyncedAt: doc.lastSyncedAt
      ? new Date(doc.lastSyncedAt).toISOString()
      : null,
    blurb: doc.blurb ?? null,
    featured: doc.featured ?? false,
    history: (doc.history ?? []).map((h) => ({
      rating: h.rating,
      effectiveDate: new Date(h.effectiveDate).toISOString(),
    })),
  }));

  return NextResponse.json({ pros }, { headers: CACHE_HEADERS });
};

export const GET = withErrorHandling(
  listProsHandler as (...args: unknown[]) => Promise<NextResponse>,
  "/api/pros"
);
