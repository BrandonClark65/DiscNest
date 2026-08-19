/**
 * Parse pasted rating rows into structured records.
 *
 * Built for two realistic inputs, both of which put the player name first,
 * then the PDGA number, then the rating:
 *
 *  - A copy-paste of the PDGA player stats table (tab-separated, many trailing
 *    columns like year, division, points, cash - all ignored).
 *  - A simple CSV: `Name, PDGA#, Rating` (extra columns ignored).
 *
 * Rather than trust column positions (names can contain spaces, delimiters
 * vary), it scans each line's integer tokens: the first integer in the PDGA
 * range is the number, the first integer after it in the rating range is the
 * rating, and the name is whatever text preceded the number.
 */

export interface ParsedRatingRow {
  name?: string;
  pdgaNumber: number;
  rating: number;
  division?: 'MPO' | 'FPO';
}

export interface RatingParseResult {
  rows: ParsedRatingRow[];
  errors: Array<{ line: number; text: string; reason: string }>;
}

// PDGA numbers for modern touring pros are 4+ digits; keeping the floor high
// avoids picking up small stray integers (event counts, cash fragments).
const PDGA_MIN = 1000;
const PDGA_MAX = 9_999_999;
// Plausible player rating band. 2026 (year) sits above it; event counts below.
const RATING_MIN = 600;
const RATING_MAX = 1200;

function inferDivision(line: string): 'MPO' | 'FPO' | undefined {
  if (/\bfemale\b/i.test(line) || /\bFPO\b/.test(line)) return 'FPO';
  if (/\bmale\b/i.test(line) || /\bMPO\b/.test(line)) return 'MPO';
  return undefined;
}

export function parseRatingRows(input: string): RatingParseResult {
  const rows: ParsedRatingRow[] = [];
  const errors: RatingParseResult['errors'] = [];
  const seen = new Set<number>();

  input.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;

    // Skip an obvious header row (has "PDGA" / "Rating" labels but no real data).
    if (/pdga\s*#/i.test(line) && !/\d{4,}/.test(line)) return;
    if (/^name\b/i.test(line) && !/\d{4,}/.test(line)) return;

    const ints = [...line.matchAll(/\d+/g)].map((m) => ({
      value: Number(m[0]),
      index: m.index ?? 0,
    }));

    const pdga = ints.find((t) => t.value >= PDGA_MIN && t.value <= PDGA_MAX);
    if (!pdga) {
      errors.push({ line: index + 1, text: line, reason: 'No PDGA number found' });
      return;
    }

    const ratingTok = ints.find(
      (t) => t.index > pdga.index && t.value >= RATING_MIN && t.value <= RATING_MAX
    );
    if (!ratingTok) {
      errors.push({ line: index + 1, text: line, reason: 'No rating found' });
      return;
    }

    if (seen.has(pdga.value)) return; // duplicate player row (e.g. a second division)
    seen.add(pdga.value);

    const name = line.slice(0, pdga.index).replace(/[,\s]+$/, '').trim() || undefined;

    rows.push({
      name,
      pdgaNumber: pdga.value,
      rating: ratingTok.value,
      division: inferDivision(line),
    });
  });

  return { rows, errors };
}

/** Turn a display name into a URL-safe slug, folding accents to plain letters. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    // Drop the combining marks NFKD leaves behind, so "Jurcikova" not "jurc-i-kova".
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
