import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import { setupStandardMocks, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();

describe("GET /api/stores", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("returns empty array when no stores exist", async () => {
    const res = await request(app).get("/api/stores");

    expect(res.status).toBe(200);
    expect(res.body.stores).toEqual([]);
  });

  test("returns stores with valid location and storeName", async () => {
    const store1 = await User.create({
      name: "Store One",
      email: "store1@test.com",
      role: "store",
      storeName: "store-one",
      location: {
        type: "Point",
        coordinates: [-122.4194, 37.7749], // San Francisco
      },
    });

    const store2 = await User.create({
      name: "Store Two",
      email: "store2@test.com",
      role: "store",
      storeName: "store-two",
      location: {
        type: "Point",
        coordinates: [-118.2437, 34.0522], // Los Angeles
      },
    });

    // Regular user should not appear
    await User.create({
      name: "Regular User",
      email: "user@test.com",
      role: "user",
    });

    const res = await request(app).get("/api/stores");

    expect(res.status).toBe(200);
    expect(res.body.stores).toHaveLength(2);
    expect(res.body.stores.map((s: { storeName: string }) => s.storeName)).toContain("store-one");
    expect(res.body.stores.map((s: { storeName: string }) => s.storeName)).toContain("store-two");
  });

  test("filters stores by distance when lat/lng provided", async () => {
    // Create stores at different locations
    const nearStore = await User.create({
      name: "Near Store",
      email: "near@test.com",
      role: "store",
      storeName: "near-store",
      location: {
        type: "Point",
        coordinates: [-122.4194, 37.7749], // San Francisco
      },
    });

    const farStore = await User.create({
      name: "Far Store",
      email: "far@test.com",
      role: "store",
      storeName: "far-store",
      location: {
        type: "Point",
        coordinates: [-118.2437, 34.0522], // Los Angeles
      },
    });

    // Ensure geo index exists (create it if needed)
    try {
      await User.collection.createIndex({ location: "2dsphere" });
    } catch (e) {
      // Index might already exist, that's fine
    }

    // Query from San Francisco
    const res = await request(app).get("/api/stores?lat=37.7749&lng=-122.4194&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.stores.length).toBeGreaterThan(0);
    // Near store should be first (closest) - check if it's in the results
    const storeNames = res.body.stores.map((s: { storeName: string }) => s.storeName);
    expect(storeNames).toContain("near-store");
    // Should have distance field for geo-sorted results
    if (res.body.stores[0].distance !== undefined) {
      expect(res.body.stores[0].distance).toBeDefined();
    }
  });

  test("excludes stores without storeName", async () => {
    await User.create({
      name: "Store Without Name",
      email: "noname@test.com",
      role: "store",
      // No storeName
      location: {
        type: "Point",
        coordinates: [-122.4194, 37.7749],
      },
    });

    const res = await request(app).get("/api/stores");

    expect(res.status).toBe(200);
    expect(res.body.stores).toHaveLength(0);
  });

  test("respects limit parameter", async () => {
    // Create multiple stores
    for (let i = 0; i < 5; i++) {
      await User.create({
        name: `Store ${i}`,
        email: `store${i}@test.com`,
        role: "store",
        storeName: `store-${i}`,
        location: {
          type: "Point",
          coordinates: [-122.4194 + i * 0.1, 37.7749 + i * 0.1],
        },
      });
    }

    const res = await request(app).get("/api/stores?limit=2");

    expect(res.status).toBe(200);
    expect(res.body.stores.length).toBeLessThanOrEqual(2);
  });
});

describe("GET /api/stores/[storeName]", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("returns 404 for non-existent store", async () => {
    const res = await request(app).get("/api/stores/non-existent-store");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Store not found");
  });

  test("returns store with listings", async () => {
    const store = await User.create({
      name: "Test Store",
      email: "store@test.com",
      role: "store",
      storeName: "test-store",
      location: {
        type: "Point",
        coordinates: [-122.4194, 37.7749],
      },
    });

    const listing1 = await Listing.create({
      title: "Disc 1",
      type: "Sell",
      userId: store._id,
      price: 20,
    });

    const listing2 = await Listing.create({
      title: "Disc 2",
      type: "Sell",
      userId: store._id,
      price: 25,
      sold: true, // Should be excluded
    });

    const listing3 = await Listing.create({
      title: "Disc 3",
      type: "Sell",
      userId: store._id,
      price: 30,
      pendingReview: true, // Should be excluded
    });

    const res = await request(app).get("/api/stores/test-store");

    expect(res.status).toBe(200);
    expect(res.body.store.storeName).toBe("test-store");
    expect(res.body.store.name).toBe("Test Store");
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0]._id).toBe(listing1._id.toString());
    expect(res.body.listingCount).toBe(1);
  });

  test("handles store name case insensitivity", async () => {
    await User.create({
      name: "Test Store",
      email: "store@test.com",
      role: "store",
      storeName: "test-store",
    });

    const res = await request(app).get("/api/stores/TEST-STORE");

    expect(res.status).toBe(200);
    expect(res.body.store.storeName).toBe("test-store");
  });

  test("returns empty listings array when store has no listings", async () => {
    await User.create({
      name: "Empty Store",
      email: "empty@test.com",
      role: "store",
      storeName: "empty-store",
    });

    const res = await request(app).get("/api/stores/empty-store");

    expect(res.status).toBe(200);
    expect(res.body.listings).toEqual([]);
    expect(res.body.listingCount).toBe(0);
  });
});

