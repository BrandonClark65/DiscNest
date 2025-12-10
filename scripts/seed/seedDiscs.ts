import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectToDatabase } from '../../src/lib/mongodb';
import Disc from '../../src/models/Disc';
import fetch from 'node-fetch';


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

async function seedDiscs() {
  await connectToDatabase();

  const res = await fetch('https://discit-api.fly.dev/disc');
  const discs = await res.json() as DiscItDisc[];

  // Step 1: Get existing disc identifiers
  type ExistingDisc = { name: string; brand: string };
  const existingDiscs = await Disc.find({}, 'name brand') as ExistingDisc[];
  const existingSet = new Set(
    existingDiscs.map((d: ExistingDisc) => `${d.name.toLowerCase()}|${d.brand.toLowerCase()}`)
  );


  // Step 2: Format and filter new discs
  const newDiscs = discs
    .map(disc => ({
      name: disc.name,
      brand: disc.brand,
      type: disc.category,
      stability: disc.stability,
      plastic: 'Unknown', // Use "Unknown" enum value instead of empty string
      wearLevel: 0,
      notes: '',
      flight: {
        speed: disc.speed,
        glide: disc.glide,
        turn: disc.turn,
        fade: disc.fade,
      },
      image: disc.pic,
      storeLink: disc.link,
    }))
    .filter(disc => {
      const key = `${disc.name.toLowerCase()}|${disc.brand.toLowerCase()}`;
      return !existingSet.has(key);
    });

  // Step 3: Bulk insert only new discs
  if (newDiscs.length > 0) {
    await Disc.insertMany(newDiscs);
    console.log(`✅ Inserted ${newDiscs.length} new discs`);
  } else {
    console.log('⏩ No new discs to insert');
  }
}

seedDiscs().catch(console.error);