import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { connectToDatabase } from "@/lib/mongodb";
import Disc from "@/models/Disc";
import fetch from "node-fetch";

type DiscItDisc = {
  name: string;
  brand: string;
  category: string;
  stability: string;
  speed: number;
  glide: number;
  turn: number;
  fade: number;
  pic: string;
  link: string;
};

const seedHandler = async () => {
  await connectToDatabase();

  const res = await fetch("https://discit-api.fly.dev/disc");
  const discs = (await res.json()) as DiscItDisc[];

  // Step 1: Get existing disc identifiers
  type ExistingDisc = { name: string; brand: string };
  const existingDiscs = (await Disc.find({}, "name brand")) as ExistingDisc[];
  const existingSet = new Set(
    existingDiscs.map(
      (d: ExistingDisc) => `${d.name.toLowerCase()}|${d.brand.toLowerCase()}`
    )
  );

  // Step 2: Format and filter new discs
  const newDiscs = discs
    .map((disc) => ({
      name: disc.name,
      brand: disc.brand,
      type: disc.category,
      stability: disc.stability,
      plastic: "",
      wearLevel: 0,
      notes: "",
      flight: {
        speed: disc.speed,
        glide: disc.glide,
        turn: disc.turn,
        fade: disc.fade,
      },
      image: disc.pic,
      storeLink: disc.link,
    }))
    .filter((disc) => {
      const key = `${disc.name.toLowerCase()}|${disc.brand.toLowerCase()}`;
      return !existingSet.has(key);
    });

  // Step 3: Bulk insert only new discs
  let insertedCount = 0;
  if (newDiscs.length > 0) {
    await Disc.insertMany(newDiscs);
    insertedCount = newDiscs.length;
    console.log(`✅ Inserted ${insertedCount} new discs`);
  } else {
    console.log("⏩ No new discs to insert");
  }

  return NextResponse.json({
    message: "Seeding completed",
    inserted: insertedCount,
    total: discs.length,
    existing: existingDiscs.length,
  });
};

export const POST = withAdminAuth(
  withErrorHandling(
    seedHandler as (...args: unknown[]) => Promise<NextResponse>,
    "/api/seed"
  )
);
