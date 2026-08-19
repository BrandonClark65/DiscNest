import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectToDatabase } from '../../src/lib/mongodb';
import ProPlayer from '../../src/models/ProPlayer';
import { proPlayerSchema } from '../../src/lib/validation/proPlayerSchema';

/**
 * Seed a starter set of touring pros for the handicap-comparison feature.
 *
 * `pdgaNumber` and `rating` below come from the official PDGA player stats page
 * (pdga.com/players/stats), reflecting the 2026 ratings. Because the source
 * lists players by first initial, the full first names were expanded by hand:
 * double-check any name against the PDGA page before relying on it, since a
 * wrong name is what a visitor sees. The PDGA numbers are the exact figures
 * from that page and are what a future API sync keys on.
 *
 * Update ratings by hand (or, later, from the PDGA API) each time the monthly
 * PDGA update publishes. Re-running is safe: existing pros are matched by slug
 * and left untouched, so this never clobbers a value you have since corrected.
 * Only missing pros are inserted.
 */
const seedPros: Array<{
  name: string;
  slug: string;
  division: 'MPO' | 'FPO';
  pdgaNumber: number;
  rating: number;
  blurb: string;
  displayOrder: number;
}> = [
  // --- MPO (rating order) ---
  { name: 'Gannon Buhr', slug: 'gannon-buhr', division: 'MPO', pdgaNumber: 75412, rating: 1062, blurb: 'Currently the top-rated MPO player.', displayOrder: 1 },
  { name: 'Ricky Wysocki', slug: 'ricky-wysocki', division: 'MPO', pdgaNumber: 38008, rating: 1053, blurb: 'Two-time World Champion.', displayOrder: 2 },
  { name: 'Calvin Heimburg', slug: 'calvin-heimburg', division: 'MPO', pdgaNumber: 45971, rating: 1052, blurb: 'Elite MPO touring pro.', displayOrder: 3 },
  { name: 'Paul McBeth', slug: 'paul-mcbeth', division: 'MPO', pdgaNumber: 27523, rating: 1048, blurb: 'Multiple-time World Champion.', displayOrder: 4 },
  { name: 'Isaac Robinson', slug: 'isaac-robinson', division: 'MPO', pdgaNumber: 50670, rating: 1048, blurb: 'Elite MPO touring pro.', displayOrder: 5 },
  { name: 'Eagle McMahon', slug: 'eagle-mcmahon', division: 'MPO', pdgaNumber: 37817, rating: 1045, blurb: 'Distance specialist and major winner.', displayOrder: 6 },
  { name: 'Chris Dickerson', slug: 'chris-dickerson', division: 'MPO', pdgaNumber: 62467, rating: 1043, blurb: 'Elite MPO touring pro.', displayOrder: 7 },
  { name: 'Niklas Anttila', slug: 'niklas-anttila', division: 'MPO', pdgaNumber: 91249, rating: 1042, blurb: 'Finnish MPO tour standout.', displayOrder: 8 },
  { name: 'Adam Hammes', slug: 'adam-hammes', division: 'MPO', pdgaNumber: 57365, rating: 1039, blurb: 'MPO tour standout.', displayOrder: 9 },
  { name: 'Anthony Barela', slug: 'anthony-barela', division: 'MPO', pdgaNumber: 44382, rating: 1038, blurb: 'MPO tour standout.', displayOrder: 10 },

  // --- FPO (rating order) ---
  { name: 'Silva Saarinen', slug: 'silva-saarinen', division: 'FPO', pdgaNumber: 107335, rating: 991, blurb: 'Finnish FPO tour standout.', displayOrder: 11 },
  { name: 'Ohn Scoggins', slug: 'ohn-scoggins', division: 'FPO', pdgaNumber: 48976, rating: 989, blurb: 'Veteran FPO touring pro.', displayOrder: 12 },
  { name: 'Eveliina Salonen', slug: 'eveliina-salonen', division: 'FPO', pdgaNumber: 64927, rating: 988, blurb: 'Finnish FPO tour star.', displayOrder: 13 },
  { name: 'Missy Gannon', slug: 'missy-gannon', division: 'FPO', pdgaNumber: 85942, rating: 986, blurb: 'Top FPO tour contender.', displayOrder: 14 },
  { name: 'Holyn Handley', slug: 'holyn-handley', division: 'FPO', pdgaNumber: 133547, rating: 984, blurb: 'FPO tour title contender.', displayOrder: 15 },
  { name: 'Valerie Mandujano', slug: 'valerie-mandujano', division: 'FPO', pdgaNumber: 62879, rating: 972, blurb: 'FPO tour standout.', displayOrder: 16 },
  { name: 'Henna Blomroos', slug: 'henna-blomroos', division: 'FPO', pdgaNumber: 59227, rating: 968, blurb: 'Finnish FPO touring pro.', displayOrder: 17 },
  { name: 'Catrina Allen', slug: 'catrina-allen', division: 'FPO', pdgaNumber: 44184, rating: 968, blurb: 'Veteran FPO touring pro.', displayOrder: 18 },
];

async function seedProPlayers() {
  await connectToDatabase();

  let inserted = 0;
  let skipped = 0;

  for (const pro of seedPros) {
    // Validate every entry through the same schema the app will use, so a typo
    // in this file fails loudly instead of writing a bad record.
    const parsed = proPlayerSchema.parse(pro);

    const result = await ProPlayer.updateOne(
      { slug: parsed.slug },
      {
        $setOnInsert: {
          ...parsed,
          featured: true,
          active: true,
          syncSource: 'manual',
          ratingUpdatedAt: new Date(),
          history: [{ rating: parsed.rating, effectiveDate: new Date() }],
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount && result.upsertedCount > 0) {
      inserted += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(`✅ Pro players seeded: ${inserted} inserted, ${skipped} already present.`);
  console.log('ℹ️  Ratings reflect the 2026 PDGA stats page. Re-running never overwrites existing pros.');
  process.exit(0);
}

seedProPlayers().catch((err) => {
  console.error(err);
  process.exit(1);
});
