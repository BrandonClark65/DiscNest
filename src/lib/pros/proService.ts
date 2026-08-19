import { connectToDatabase } from "@/lib/mongodb";
import ProPlayer from "@/models/ProPlayer";

/** A pro serialized for the client and share surfaces. Display-safe only. */
export interface SerializedPro {
  id: string;
  slug: string;
  name: string;
  division: string;
  rating: number;
  previousRating: number | null;
  ratingUpdatedAt: string | null;
  lastSyncedAt: string | null;
  blurb: string | null;
  featured: boolean;
  history: Array<{ rating: number; effectiveDate: string }>;
}

type ProDoc = {
  _id: { toString(): string };
  slug: string;
  name: string;
  division: string;
  rating: number;
  manualOverride?: number;
  previousRating?: number;
  ratingUpdatedAt?: Date;
  lastSyncedAt?: Date;
  blurb?: string;
  featured?: boolean;
  history?: Array<{ rating: number; effectiveDate: Date }>;
};

function serialize(doc: ProDoc): SerializedPro {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    division: doc.division,
    // The admin pin wins over the stored rating at display time.
    rating: doc.manualOverride ?? doc.rating,
    previousRating: doc.previousRating ?? null,
    ratingUpdatedAt: doc.ratingUpdatedAt
      ? new Date(doc.ratingUpdatedAt).toISOString()
      : null,
    lastSyncedAt: doc.lastSyncedAt ? new Date(doc.lastSyncedAt).toISOString() : null,
    blurb: doc.blurb ?? null,
    featured: doc.featured ?? false,
    history: (doc.history ?? []).map((h) => ({
      rating: h.rating,
      effectiveDate: new Date(h.effectiveDate).toISOString(),
    })),
  };
}

/**
 * All active pros in display order. Shared by the /api/pros route, the
 * /handicap/pros page, and the OG image route so the query and the safe-field
 * projection live in exactly one place.
 */
export async function getActivePros(): Promise<SerializedPro[]> {
  await connectToDatabase();
  // The public pages (/handicap and /handicap/pros) show the admin-curated set:
  // active AND featured, in displayOrder. A pro can be imported but left
  // unfeatured so it exists for admin tools and share links without appearing
  // on the public pages.
  const docs = await ProPlayer.find({ active: true, featured: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean<ProDoc[]>();
  return docs.map(serialize);
}

/** A single active pro by slug, or null. Used by share links and the OG image. */
export async function getProBySlug(slug: string): Promise<SerializedPro | null> {
  await connectToDatabase();
  const doc = await ProPlayer.findOne({ slug, active: true }).lean<ProDoc | null>();
  return doc ? serialize(doc) : null;
}

/**
 * Several pros by slug, returned in the exact order the slugs were given (so a
 * caller-chosen ordering survives), skipping any slug that does not resolve.
 * Includes inactive pros: an admin building a ratings card may pick one.
 */
export async function getProsBySlugs(slugs: string[]): Promise<SerializedPro[]> {
  if (slugs.length === 0) return [];
  await connectToDatabase();
  const docs = await ProPlayer.find({ slug: { $in: slugs } }).lean<ProDoc[]>();
  const bySlug = new Map(docs.map((d) => [d.slug, serialize(d)]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is SerializedPro => Boolean(p));
}
