import { describe, test, expect } from 'vitest';

import { throwsFromPro } from '@/lib/handicap/proComparison';
import { PTS_PER_THROW_STD } from '@/app/constants/handicapConfig';

// All cases use the standard 10 points-per-throw scale unless noted, so a
// 100-point rating gap is exactly 10 throws.

describe('throwsFromPro', () => {
  test('a lower-rated player receives throws from the pro', () => {
    const { throws, unrounded, perHoles } = throwsFromPro(900, 1000);
    expect(throws).toBe(10);
    expect(unrounded).toBeCloseTo(10, 5);
    expect(perHoles).toBe(10);
  });

  test('equal ratings mean zero throws either way', () => {
    const { throws, perHoles } = throwsFromPro(1000, 1000);
    expect(throws).toBe(0);
    expect(perHoles).toBe(0);
  });

  test('a higher-rated player gives throws back (negative headline)', () => {
    // The sign carries the direction; the UI words it as "throws given back"
    // rather than rendering a raw negative, but the number must stay signed.
    const { throws, perHoles } = throwsFromPro(1050, 1000);
    expect(throws).toBe(-5);
    // perHoles is a magnitude, so it stays positive.
    expect(perHoles).toBe(5);
  });

  test('perHoles never exceeds 18, even for a huge gap', () => {
    const { throws, perHoles } = throwsFromPro(700, 1030);
    expect(throws).toBe(33);
    expect(perHoles).toBe(18);
  });

  test('the headline rounds a half-throw up to a whole throw', () => {
    // 95-point gap = 9.5 throws; the headline is a whole number.
    const { throws, unrounded } = throwsFromPro(905, 1000);
    expect(unrounded).toBeCloseTo(9.5, 5);
    expect(throws).toBe(10);
  });

  test('uses an allowance of 1.0 by default, not the 0.95 handicap allowance', () => {
    // A 200-point gap is 20 throws at full allowance. At 0.95 it would be 19.
    expect(throwsFromPro(800, 1000).throws).toBe(20);
    expect(throwsFromPro(800, 1000, { allowance: 0.95 }).throws).toBe(19);
  });

  test('honors a custom points-per-throw for easier or harder layouts', () => {
    // Halving ppt doubles the throws for the same rating gap.
    const { throws } = throwsFromPro(900, 1000, { ppt: PTS_PER_THROW_STD / 2 });
    expect(throws).toBe(20);
  });
});
