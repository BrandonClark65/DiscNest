import { NextResponse } from "next/server";
import ProPlayer from "@/models/ProPlayer";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { connectToDatabase } from "@/lib/mongodb";
import { applyRatingUpdate, type MutableProDoc } from "@/lib/pros/proMutations";
import {
  proPlayerSchema,
  proPlayerUpdateSchema,
} from "@/lib/validation/proPlayerSchema";

type AdminProDoc = MutableProDoc & {
  _id: { toString(): string };
  slug: string;
  name: string;
  division: string;
  pdgaNumber?: number;
  manualOverride?: number | null;
  blurb?: string;
  featured?: boolean;
  displayOrder?: number;
  active?: boolean;
  set: (fields: Record<string, unknown>) => void;
  save: () => Promise<unknown>;
};

/** Full admin view of a pro - includes fields the public API never returns. */
function serializeAdmin(doc: AdminProDoc) {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    division: doc.division,
    pdgaNumber: doc.pdgaNumber ?? null,
    rating: doc.rating,
    manualOverride: doc.manualOverride ?? null,
    effectiveRating: doc.manualOverride ?? doc.rating,
    previousRating: doc.previousRating ?? null,
    ratingUpdatedAt: doc.ratingUpdatedAt ? new Date(doc.ratingUpdatedAt).toISOString() : null,
    lastSyncedAt: doc.lastSyncedAt ? new Date(doc.lastSyncedAt).toISOString() : null,
    syncSource: doc.syncSource ?? "manual",
    blurb: doc.blurb ?? null,
    featured: doc.featured ?? false,
    displayOrder: doc.displayOrder ?? 0,
    active: doc.active ?? true,
    historyCount: doc.history?.length ?? 0,
  };
}

// GET: every pro, active or not, in display order.
const listHandler = async () => {
  await connectToDatabase();
  const docs = (await ProPlayer.find().sort({ displayOrder: 1, name: 1 })) as unknown as AdminProDoc[];
  return NextResponse.json({ pros: docs.map(serializeAdmin) });
};

// POST: create a pro.
const createHandler = async (req: Request) => {
  await connectToDatabase();
  const body = await req.json();
  const data = proPlayerSchema.parse(body);

  const created = (await ProPlayer.create({
    ...data,
    ratingUpdatedAt: new Date(),
    syncSource: "manual",
    history: [{ rating: data.rating, effectiveDate: new Date() }],
  })) as unknown as AdminProDoc;

  return NextResponse.json({ pro: serializeAdmin(created) }, { status: 201 });
};

// PATCH: edit a pro. A rating change is routed through applyRatingUpdate so the
// history advances just as a sync or import would; other fields are set directly.
const updateHandler = async (req: Request) => {
  await connectToDatabase();
  const body = await req.json();
  const { id, rating, ...fields } = proPlayerUpdateSchema.parse(body);

  const doc = (await ProPlayer.findById(id)) as unknown as AdminProDoc | null;
  if (!doc) {
    return NextResponse.json({ error: "Pro not found" }, { status: 404 });
  }

  if (rating != null) applyRatingUpdate(doc, rating, "manual");
  if (Object.keys(fields).length > 0) doc.set(fields);
  await doc.save();

  return NextResponse.json({ pro: serializeAdmin(doc) });
};

// DELETE ?id=...: soft delete (deactivate), so existing share links still resolve.
const deleteHandler = async (req: Request) => {
  await connectToDatabase();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const doc = (await ProPlayer.findById(id)) as unknown as AdminProDoc | null;
  if (!doc) return NextResponse.json({ error: "Pro not found" }, { status: 404 });

  doc.set({ active: false });
  await doc.save();
  return NextResponse.json({ ok: true });
};

// Cast handlers to the loose signature withErrorHandling expects (see the
// /api/handicap/share route for the same pattern with typed-param handlers).
type LooseHandler = (...args: unknown[]) => Promise<NextResponse>;

export const GET = withAdminAuth(withErrorHandling(listHandler as LooseHandler, "/api/admin/pros"));
export const POST = withAdminAuth(withErrorHandling(createHandler as LooseHandler, "/api/admin/pros"));
export const PATCH = withAdminAuth(withErrorHandling(updateHandler as LooseHandler, "/api/admin/pros"));
export const DELETE = withAdminAuth(withErrorHandling(deleteHandler as LooseHandler, "/api/admin/pros"));
