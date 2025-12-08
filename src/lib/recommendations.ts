import type { Disc } from '@/types/disc';
import type { DiscNestUser } from '@/types/user';

type Flight = {
  speed?: number;
  glide?: number;
  turn?: number;
  fade?: number;
};

type Reason =
  | 'missing_category'
  | 'similar_disc'
  | 'upgrade_plastic'
  | 'profile_match'
  | 'brand_match';

export type RecommendedDisc = Disc & {
  reasons: { type: Reason; explanation: string }[];
  score: number;
};

type ReasonLimit = Partial<Record<Reason, number>>;

/** Compare two discs by flight similarity (0–1) */
function flightSimilarity(a: Flight, b: Flight): number {
  if (!a.speed || !b.speed) return 0;
  const diff =
    Math.abs((a.speed ?? 0) - (b.speed ?? 0)) +
    Math.abs((a.glide ?? 0) - (b.glide ?? 0)) +
    Math.abs((a.turn ?? 0) - (b.turn ?? 0)) +
    Math.abs((a.fade ?? 0) - (b.fade ?? 0));
  return 1 / (1 + diff);
}

/** Find missing categories in the user’s discs */
function findMissingCategories(userDiscs: Disc[]): string[] {
  const types = new Set(userDiscs.map((d) => d.type));
  const all = ['Putter', 'Midrange', 'Fairway Driver', 'Distance Driver'];
  return all.filter((t) => !types.has(t));
}

/** Main recommendation engine (weighted + limited) */
export function recommendDiscs(
  user: DiscNestUser,
  userDiscs: Disc[],
  allDiscs: Disc[],
  limits: ReasonLimit = {
    missing_category: 3,
    similar_disc: 4,
    upgrade_plastic: 2,
    profile_match: 3,
    brand_match: 2,
  }
): RecommendedDisc[] {
  const missingCategories = findMissingCategories(userDiscs);
  const results: RecommendedDisc[] = [];

  for (const candidate of allDiscs) {
    let score = 0;
    const reasons: { type: Reason; explanation: string }[] = [];

    // 1️⃣ Missing category
    if (candidate.type && missingCategories.includes(candidate.type)) {
      score += 4;
      reasons.push({
        type: 'missing_category',
        explanation: `You don't have a ${candidate.type} yet — this could fill that slot.`,
      });
    }

    // 2️⃣ Similar flight to owned discs
    const maxSim = Math.max(
      ...userDiscs.map((u) => flightSimilarity(u.flight || {}, candidate.flight || {})),
      0
    );
    if (maxSim > 0.8) {
      score += 3 * maxSim;
      const similarTo = userDiscs.reduce<{ name: string; brand?: string; score: number }>(
            (best, u) => {
                const sim = flightSimilarity(u.flight || {}, candidate.flight || {});
                return sim > best.score
                ? { name: u.name, brand: u.brand, score: sim }
                : best;
            },
            { name: '', brand: '', score: 0 }
            );
      reasons.push({
        type: 'similar_disc',
        explanation: `Similar flight to your ${similarTo.name} (${similarTo.brand}).`,
      });
    }

    // 3️⃣ Plastic upgrade
    const upgradeTarget = userDiscs.find(
      (u) =>
        u.name === candidate.name &&
        u.plastic &&
        candidate.plastic &&
        u.plastic !== candidate.plastic &&
        /(Star|Champion|ESP|Opto|Gold)/i.test(candidate.plastic)
    );
    if (upgradeTarget) {
      score += 2;
      reasons.push({
        type: 'upgrade_plastic',
        explanation: `Upgrade your ${upgradeTarget.name} from ${upgradeTarget.plastic} to ${candidate.plastic}.`,
      });
    }

    // 4️⃣ Arm speed profile
    if (user.armSpeed && candidate.flight?.speed) {
      const sp = candidate.flight.speed;
      const arm = user.armSpeed.toLowerCase();
      if ((arm === 'slow' && sp <= 7) || (arm === 'medium' && sp <= 10) || (arm === 'fast' && sp >= 9)) {
        score += 2;
        reasons.push({
          type: 'profile_match',
          explanation: `Good match for your ${arm} arm speed.`,
        });
      }
    }

    // 5️⃣ Favorite brand
    if (candidate.brand && user.favoriteBrands?.includes(candidate.brand)) {
      score += 1.5;
      reasons.push({
        type: 'brand_match',
        explanation: `You’ve listed ${candidate.brand} as one of your favorite brands.`,
      });
    }

    // 6️⃣ Stability preference
    if (user.stabilityPreference && candidate.stability === user.stabilityPreference) {
      score += 1;
      reasons.push({
        type: 'profile_match',
        explanation: `Matches your preferred ${user.stabilityPreference.toLowerCase()} stability.`,
      });
    }

    // Ignore discs the user already owns
    if (userDiscs.some((u) => u.name === candidate.name && u.brand === candidate.brand)) continue;

    // Add only if relevant
    if (score > 2) results.push({ ...candidate, reasons, score });
  }

  // Sort by total score
  const sorted = results.sort((a, b) => b.score - a.score);

  // Deduplicate by name
  const seen = new Set<string>();
  const unique = sorted.filter((d) => {
    if (seen.has(d.name)) return false;
    seen.add(d.name);
    return true;
  });

  // Trim reasons to top 2
  const concise = unique.map((d) => ({
    ...d,
    reasons: d.reasons.slice(0, 2),
  }));

  // Apply per-reason type limits
  const counts: Record<Reason, number> = {
    missing_category: 0,
    similar_disc: 0,
    upgrade_plastic: 0,
    profile_match: 0,
    brand_match: 0,
  };

  const balanced = concise.filter((disc) => {
    const mainReason = disc.reasons[0]?.type;
    if (!mainReason) return false;

    const limit = limits[mainReason] ?? Infinity;
    if (counts[mainReason] < limit) {
      counts[mainReason]++;
      return true;
    }
    return false;
  });

  // Return final top 12
  return balanced.slice(0, 12);
}
