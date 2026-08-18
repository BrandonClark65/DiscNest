import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectToDatabase } from '../../src/lib/mongodb';
import ProPlayer from '../../src/models/ProPlayer';
import { proPlayerSchema } from '../../src/lib/validation/proPlayerSchema';

/**
 * Seed a starter set of touring pros for the handicap-comparison feature.
 *
 * IMPORTANT - two deliberate omissions:
 *
 *  1. `pdgaNumber` is intentionally NOT set here. The numbers must be looked up
 *     and verified against pdga.com before they are trusted, because a wrong
 *     number would make the future API sync pull a different player's rating.
 *     Fill them in (verified) once a PDGA membership and API access are in
 *     place. Until then the pros run entirely on the manual ratings below.
 *
 *  2. The ratings are SEED PLACEHOLDERS, not live official ratings. They put
 *     the feature in a usable state on day one. Update them by hand (or, later,
 *     from the PDGA API) so they reflect the current published numbers.
 *
 * Re-running is safe: existing pros are matched by slug and left untouched, so
 * this never clobbers a rating you have since corrected. Only missing pros are
 * inserted.
 */
const seedPros: Array<{
  name: string;
  slug: string;
  division: 'MPO' | 'FPO';
  rating: number;
  blurb: string;
  displayOrder: number;
}> = [
  // --- MPO ---
  { name: 'Gannon Buhr', slug: 'gannon-buhr', division: 'MPO', rating: 1054, blurb: 'Top-ranked MPO tour player.', displayOrder: 1 },
  { name: 'Calvin Heimburg', slug: 'calvin-heimburg', division: 'MPO', rating: 1049, blurb: 'Elite MPO touring pro and major contender.', displayOrder: 2 },
  { name: 'Paul McBeth', slug: 'paul-mcbeth', division: 'MPO', rating: 1047, blurb: 'Multiple-time World Champion.', displayOrder: 3 },
  { name: 'Isaac Robinson', slug: 'isaac-robinson', division: 'MPO', rating: 1043, blurb: 'Consistent MPO tour standout.', displayOrder: 4 },
  { name: 'Ricky Wysocki', slug: 'ricky-wysocki', division: 'MPO', rating: 1040, blurb: 'Two-time World Champion.', displayOrder: 5 },
  { name: 'Eagle McMahon', slug: 'eagle-mcmahon', division: 'MPO', rating: 1038, blurb: 'Distance specialist and major winner.', displayOrder: 6 },

  // --- FPO ---
  { name: 'Kristin Tattar', slug: 'kristin-tattar', division: 'FPO', rating: 1006, blurb: 'Multiple-time FPO World Champion.', displayOrder: 7 },
  { name: 'Missy Gannon', slug: 'missy-gannon', division: 'FPO', rating: 990, blurb: 'Top-ranked FPO tour player.', displayOrder: 8 },
  { name: 'Holyn Handley', slug: 'holyn-handley', division: 'FPO', rating: 986, blurb: 'FPO tour title contender.', displayOrder: 9 },
  { name: 'Ohn Scoggins', slug: 'ohn-scoggins', division: 'FPO', rating: 980, blurb: 'Veteran FPO touring pro.', displayOrder: 10 },
  { name: 'Hailey King', slug: 'hailey-king', division: 'FPO', rating: 978, blurb: 'FPO tour standout.', displayOrder: 11 },
  { name: 'Paige Pierce', slug: 'paige-pierce', division: 'FPO', rating: 976, blurb: 'Five-time World Champion.', displayOrder: 12 },
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
  console.log('ℹ️  Remember: ratings are placeholders and pdgaNumbers are unset. See the header comment.');
  process.exit(0);
}

seedProPlayers().catch((err) => {
  console.error(err);
  process.exit(1);
});
