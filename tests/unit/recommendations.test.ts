import { describe, test, expect } from "vitest";

import { recommendDiscs } from "@/lib/recommendations";
import type { Disc } from "@/types/disc";
import type { DiscNestUser } from "@/types/user";
import type { DiscBrand, DiscPlastic } from "@/app/constants/discData";

const baseUser: DiscNestUser = {
  _id: "user-1",
  armSpeed: "Medium",
  stabilityPreference: "Straight",
  favoriteBrands: ["Innova" as DiscBrand],
};

let discId = 0;
const makeDisc = (overrides: Partial<Disc>): Disc => ({
  _id: overrides._id ?? `disc-${++discId}`,
  name: overrides.name ?? `Disc ${discId}`,
  brand: overrides.brand ?? "Innova",
  type: overrides.type ?? "Putter",
  flight: overrides.flight ?? { speed: 3, glide: 3, turn: 0, fade: 1 },
  plastic: overrides.plastic,
  stability: overrides.stability,
  ...overrides,
});

describe("recommendDiscs", () => {
  test("fills missing categories and ignores discs already owned", () => {
    const userDiscs = [
      makeDisc({
        _id: "bag-1",
        name: "Aviar",
        brand: "Innova",
        type: "Putter",
        flight: { speed: 3, glide: 3, turn: 0, fade: 1 },
        plastic: "DX" as DiscPlastic,
      }),
    ];

    const candidates = [
      makeDisc({
        name: "Buzzz",
        brand: "Discraft",
        type: "Midrange",
        flight: { speed: 5, glide: 4, turn: -1, fade: 1 },
      }),
      // duplicate of existing disc should be ignored
      makeDisc({
        name: "Aviar",
        brand: "Innova",
        type: "Putter",
      }),
    ];

    const results = recommendDiscs(baseUser, userDiscs, candidates);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Buzzz");
    expect(results[0].reasons[0]).toMatchObject({
      type: "missing_category",
    });
  });

  test("adds upgrade plastic reason and deduplicates by name", () => {
    const userDiscs = [
      makeDisc({
        name: "Destroyer",
        brand: "Discmania",
        type: "Distance Driver",
        plastic: "Pro" as DiscPlastic,
        flight: { speed: 12, glide: 5, turn: -1, fade: 3 },
      }),
      makeDisc({
        name: "Teebird",
        brand: "Innova",
        type: "Fairway Driver",
      }),
    ];

    const candidates = [
      makeDisc({
        name: "Destroyer",
        brand: "Innova",
        type: "Distance Driver",
        plastic: "Star" as DiscPlastic,
        stability: "Straight",
        flight: { speed: 12, glide: 5, turn: -1, fade: 3 },
      }),
      // Slightly lower score to ensure it loses the tie-breaker
      makeDisc({
        name: "Destroyer",
        brand: "MVP",
        type: "Distance Driver",
        plastic: "Champion" as DiscPlastic,
        stability: "Overstable",
        flight: { speed: 12, glide: 4, turn: -1, fade: 4 },
      }),
    ];

    const results = recommendDiscs(baseUser, userDiscs, candidates);

    expect(results).toHaveLength(1);
    expect(results[0].reasons).toHaveLength(2);
    expect(results[0].reasons.map((r) => r.type)).toContain("upgrade_plastic");
  });

  test("respects per-reason limits when balancing results", () => {
    const userDiscs = [
      makeDisc({
        name: "Aviar",
        brand: "Innova",
        type: "Putter",
      }),
      makeDisc({
        name: "Destroyer",
        brand: "Innova",
        type: "Distance Driver",
      }),
    ];

    const candidates = [
      makeDisc({
        name: "Innova Mid 1",
        brand: "Innova",
        type: "Midrange",
      }),
      makeDisc({
        name: "Innova Mid 2",
        brand: "Innova",
        type: "Midrange",
      }),
      makeDisc({
        name: "MVP Mid",
        brand: "MVP",
        type: "Midrange",
      }),
      makeDisc({
        name: "Discmania Mid",
        brand: "Discmania",
        type: "Midrange",
      }),
    ];

    const results = recommendDiscs(baseUser, userDiscs, candidates);

    expect(results).toHaveLength(3); // default limit for missing_category
    expect(results.map((d) => d.name)).toEqual([
      "Innova Mid 1",
      "Innova Mid 2",
      "MVP Mid",
    ]);
    expect(results.every((d) => d.reasons[0]?.type === "missing_category")).toBe(
      true
    );
  });
});

