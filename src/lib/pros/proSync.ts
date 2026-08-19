import { connectToDatabase } from '@/lib/mongodb';
import ProPlayer from '@/models/ProPlayer';
import { applyRatingUpdate, type MutableProDoc } from './proMutations';
import { getProvider } from './providers';

export interface ProSyncReport {
  provider: string;
  checked: number;
  changed: number;
  unchanged: number;
  skipped: number;
  failed: number;
  errors: string[];
}

type ProSyncDoc = MutableProDoc & {
  name: string;
  pdgaNumber?: number;
  save: () => Promise<unknown>;
};

/**
 * Refresh every active pro's rating from the configured provider.
 *
 * Contract that keeps the display honest:
 *  - a provider that returns null for a player leaves that rating untouched,
 *  - a provider error on one player is recorded and never blanks a rating,
 *  - a pro with no pdgaNumber is skipped (nothing to look up).
 *
 * Under the default manual provider this changes nothing and simply stamps
 * lastSyncedAt, which is the intended no-op heartbeat.
 */
export async function syncProRatings(): Promise<ProSyncReport> {
  await connectToDatabase();
  const provider = getProvider();

  const pros = (await ProPlayer.find({ active: true })) as unknown as ProSyncDoc[];

  const report: ProSyncReport = {
    provider: provider.name,
    checked: pros.length,
    changed: 0,
    unchanged: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const numbered = pros.filter((p) => typeof p.pdgaNumber === 'number');
  report.skipped = pros.length - numbered.length;

  let ratings: Map<number, { rating: number; source: 'manual' | 'pdga_api' } | null>;
  try {
    ratings = await provider.fetchRatings(numbered.map((p) => p.pdgaNumber as number));
  } catch (err) {
    report.failed = numbered.length;
    report.errors.push(err instanceof Error ? err.message : 'Provider fetch failed');
    return report;
  }

  for (const pro of numbered) {
    try {
      const fetched = ratings.get(pro.pdgaNumber as number);
      if (!fetched) {
        // No rating available: stamp the check time, leave the rating alone.
        pro.lastSyncedAt = new Date();
        await pro.save();
        report.unchanged += 1;
        continue;
      }
      const changed = applyRatingUpdate(pro, fetched.rating, fetched.source);
      await pro.save();
      if (changed) report.changed += 1;
      else report.unchanged += 1;
    } catch (err) {
      report.failed += 1;
      report.errors.push(
        `${pro.name}: ${err instanceof Error ? err.message : 'update failed'}`
      );
    }
  }

  return report;
}
