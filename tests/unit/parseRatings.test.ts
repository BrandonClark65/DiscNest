import { describe, test, expect } from 'vitest';
import { parseRatingRows, slugify } from '@/lib/pros/parseRatings';

describe('parseRatingRows', () => {
  test('parses a tab-separated PDGA stats row, ignoring trailing columns', () => {
    const line =
      'G. Buhr\t75412\t1062\t2026\tMale\tPro\tMixed Pro Open\tUnited States\tIowa\t21\t22325\t$130,277.00';
    const { rows, errors } = parseRatingRows(line);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { name: 'G. Buhr', pdgaNumber: 75412, rating: 1062, division: 'MPO' },
    ]);
  });

  test('parses a simple CSV row', () => {
    const { rows } = parseRatingRows('R. Wysocki, 38008, 1053');
    expect(rows[0]).toMatchObject({ name: 'R. Wysocki', pdgaNumber: 38008, rating: 1053 });
  });

  test('infers FPO from a Female column', () => {
    const { rows } = parseRatingRows("S. Saarinen\t107335\t991\t2026\tFemale\tPro\tWomen's Pro Open");
    expect(rows[0].division).toBe('FPO');
  });

  test('does not mistake the year or points columns for the rating', () => {
    // 2026 (year) is above the rating band; 22325 (points) is far above it.
    const { rows } = parseRatingRows('X. Player\t99999\t1010\t2026\tMale\tPro\tOpen\t18\t22325');
    expect(rows[0].rating).toBe(1010);
  });

  test('dedupes repeated PDGA numbers (a player listed in two divisions)', () => {
    const text = ['E. McMahon\t37817\t1045\tMale', 'E. McMahon\t37817\t1045\tMale'].join('\n');
    const { rows } = parseRatingRows(text);
    expect(rows).toHaveLength(1);
  });

  test('skips a header row and reports an unparseable row', () => {
    const text = ['Name\tPDGA #\tRating\tYear', 'no numbers at all here'].join('\n');
    const { rows, errors } = parseRatingRows(text);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].reason).toMatch(/No PDGA number/);
  });
});

describe('slugify', () => {
  test('produces URL-safe slugs and folds accents to plain letters', () => {
    expect(slugify('Gannon Buhr')).toBe('gannon-buhr');
    expect(slugify('Kristin Tattar!')).toBe('kristin-tattar');
    expect(slugify('Klára Jurčíková')).toBe('klara-jurcikova');
  });
});
