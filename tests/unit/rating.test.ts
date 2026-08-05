import { vi, describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import { connectTestDb, resetTestDb, closeTestDb } from "../utils/testDb";
import Rating from "@/models/Rating";
import User from "@/models/User";
import { RATING_CONFIG } from "@/app/constants/ratingConfig";

// Mock connectToDatabase
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: vi.fn(async () => {
    // Connection handled by connectTestDb
    return {};
  }),
}));

describe("Rating Model", () => {
  beforeAll(async () => {
    await connectTestDb();
  });
  afterEach(async () => {
    await resetTestDb();
  });
  afterAll(closeTestDb);

  test("creates rating with valid data", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rating = await Rating.create({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      rating: 5,
      review: "Great seller!",
      role: "buyer",
    });

    expect(rating.rating).toBe(5);
    expect(rating.review).toBe("Great seller!");
    expect(rating.role).toBe("buyer");
  });

  test("validates rating min value (1)", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rating = new Rating({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      rating: 0, // Below minimum
      role: "buyer",
    });

    await expect(rating.save()).rejects.toThrow();
  });

  test("validates rating max value (5)", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rating = new Rating({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      rating: 6, // Above maximum
      role: "buyer",
    });

    await expect(rating.save()).rejects.toThrow();
  });

  test("requires rating field", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rating = new Rating({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      // rating missing
      role: "buyer",
    });

    await expect(rating.save()).rejects.toThrow();
  });

  test("requires role field", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rating = new Rating({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      rating: 5,
      // role missing
    });

    await expect(rating.save()).rejects.toThrow();
  });

  test("validates role enum", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rating = new Rating({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      rating: 5,
      role: "invalid" as any,
    });

    await expect(rating.save()).rejects.toThrow();
  });

  test("allows optional review field", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rating = await Rating.create({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      rating: 5,
      role: "buyer",
      // review is optional
    });

    expect(rating.review).toBeUndefined();
  });

  test("validates review max length", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const longReview = "a".repeat(RATING_CONFIG.MAX_REVIEW_LENGTH + 1);

    const rating = new Rating({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      rating: 5,
      review: longReview,
      role: "buyer",
    });

    await expect(rating.save()).rejects.toThrow();
  });

  test("enforces unique index for duplicate ratings", async () => {
    const rater = await User.create({
      name: "Rater",
      email: `rater-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const rated = await User.create({
      name: "Rated",
      email: `rated-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const listing = await import("@/models/Listing").then((m) => m.default);
    const listingDoc = await listing.create({
      title: "Test Listing",
      userId: rated._id,
      type: "Sell",
    });

    // Create first rating
    await Rating.create({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      listingId: listingDoc._id,
      rating: 5,
      role: "buyer",
    });

    // Try to create duplicate rating
    const duplicateRating = new Rating({
      raterUserId: rater._id,
      ratedUserId: rated._id,
      listingId: listingDoc._id,
      rating: 4,
      role: "buyer",
    });

    await expect(duplicateRating.save()).rejects.toThrow();
  });
});

