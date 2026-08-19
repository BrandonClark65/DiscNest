import { connectToDatabase } from '@/lib/mongodb';
import ProPlayer from '@/models/ProPlayer';
import { applyRatingUpdate, type MutableProDoc } from './proMutations';
import { parseRatingRows, slugify, type ParsedRatingRow } from './parseRatings';

export interface ImportOptions {
  /** Create pros for rows whose PDGA number is not already in the database. */
  createMissing?: boolean;
}

export interface ImportReport {
  parsed: number;
  updated: number;
  unchanged: number;
  created: number;
  /** Rows that matched nothing and were not created. */
  unmatched: Array<{ pdgaNumber: number; name?: string; rating: number; reason: string }>;
  parseErrors: Array<{ line: number; text: string; reason: string }>;
}

type ImportDoc = MutableProDoc & { pdgaNumber?: number; save: () => Promise<unknown> };

/**
 * Apply pasted ratings to the pro collection.
 *
 * Matching is by PDGA number, the stable identity. A matched pro's rating is
 * updated (advancing history when it moved); an unmatched row is either created
 * (when createMissing is on and the row has a name and division) or reported
 * back so the admin can add it deliberately. Nothing is ever deleted.
 */
export async function importRatings(
  text: string,
  options: ImportOptions = {}
): Promise<ImportReport> {
  const { rows, errors } = parseRatingRows(text);
  await connectToDatabase();

  const report: ImportReport = {
    parsed: rows.length,
    updated: 0,
    unchanged: 0,
    created: 0,
    unmatched: [],
    parseErrors: errors,
  };

  // Next display order for any pros we create, so they land after the current set.
  const last = await ProPlayer.findOne().sort({ displayOrder: -1 }).lean<{ displayOrder?: number } | null>();
  let nextOrder = (last?.displayOrder ?? 0) + 1;

  for (const row of rows) {
    const existing = (await ProPlayer.findOne({ pdgaNumber: row.pdgaNumber })) as unknown as
      | ImportDoc
      | null;

    if (existing) {
      const changed = applyRatingUpdate(existing, row.rating, 'manual');
      await existing.save();
      if (changed) report.updated += 1;
      else report.unchanged += 1;
      continue;
    }

    if (!options.createMissing) {
      report.unmatched.push({ ...rowSummary(row), reason: 'No pro with this PDGA number' });
      continue;
    }
    if (!row.name || !row.division) {
      report.unmatched.push({
        ...rowSummary(row),
        reason: 'Cannot create: row is missing a name or division',
      });
      continue;
    }

    await ProPlayer.create({
      name: row.name,
      slug: await uniqueSlug(row.name, row.pdgaNumber),
      division: row.division,
      pdgaNumber: row.pdgaNumber,
      rating: row.rating,
      ratingUpdatedAt: new Date(),
      lastSyncedAt: new Date(),
      syncSource: 'manual',
      featured: false,
      active: true,
      displayOrder: nextOrder,
      history: [{ rating: row.rating, effectiveDate: new Date() }],
    });
    nextOrder += 1;
    report.created += 1;
  }

  return report;
}

function rowSummary(row: ParsedRatingRow) {
  return { pdgaNumber: row.pdgaNumber, name: row.name, rating: row.rating };
}

/** A slug for a new pro, disambiguated by PDGA number if the base is taken. */
async function uniqueSlug(name: string, pdgaNumber: number): Promise<string> {
  const base = slugify(name) || `pro-${pdgaNumber}`;
  const taken = await ProPlayer.findOne({ slug: base }).select('_id').lean();
  return taken ? `${base}-${pdgaNumber}` : base;
}
