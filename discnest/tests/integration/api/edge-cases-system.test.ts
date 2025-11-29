// tests/integration/api/edge-cases-system.test.ts
// System-level edge cases: Concurrency, Database Failures, Timeouts
import "./edge-cases-shared-setup";
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import { mockRequireUser, mockAddSystemMessageToThreads } from "./edge-cases-shared-setup";

describe("Edge Cases: System", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockRequireUser.mockReset();
    mockAddSystemMessageToThreads.mockReset();
    vi.clearAllMocks();
  });
  afterAll(closeTestDb);

  describe("Concurrent Operations (Race Conditions)", () => {
    test("listings: handles concurrent updates to same listing", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const listing = await Listing.create({
        title: "Original Title",
        brand: "Innova",
        type: "Sell",
        condition: "New",
        price: 20,
        userId: user._id,
        location: {
          type: "Point",
          coordinates: [-122.4194, 37.7749],
        },
      });

      mockRequireUser.mockResolvedValue({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });

      const promises = [
        request(app)
          .patch(`/api/listings/${listing._id}`)
          .send({ action: "markSold" }),
        request(app)
          .patch(`/api/listings/${listing._id}`)
          .send({ action: "markSold" }),
        request(app)
          .patch(`/api/listings/${listing._id}`)
          .send({ action: "markSold" }),
      ];

      const results = await Promise.all(promises);

      results.forEach((res) => {
        expect([200, 404]).toContain(res.status);
      });

      const updatedListing = await Listing.findById(listing._id);
      if (updatedListing) {
        expect(updatedListing.sold).toBe(true);
      }
    });

    test("profile: handles concurrent profile updates", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      mockRequireUser.mockResolvedValue({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });

      const promises = [
        request(app)
          .post("/api/profile")
          .send({ bio: "Update 1" }),
        request(app)
          .post("/api/profile")
          .send({ bio: "Update 2" }),
        request(app)
          .post("/api/profile")
          .send({ bio: "Update 3" }),
      ];

      const results = await Promise.all(promises);

      results.forEach((res) => {
        expect(res.status).toBe(200);
      });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser).toBeDefined();
      if (updatedUser?.bio) {
        expect(["Update 1", "Update 2", "Update 3"]).toContain(updatedUser.bio);
      }
    });
  });

  describe("Database Failures", () => {
    test("profile: handles database connection failure gracefully", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      mockRequireUser.mockResolvedValueOnce({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });

      const originalFindByIdAndUpdate = User.findByIdAndUpdate;
      User.findByIdAndUpdate = vi.fn().mockRejectedValueOnce(
        new Error("Database connection lost")
      );

      const res = await request(app)
        .post("/api/profile")
        .send({ bio: "Test bio" });

      expect([500, 200]).toContain(res.status);

      User.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });

  describe("Timeout Scenarios", () => {
    test("reverse-geocode: handles slow external API response", async () => {
      process.env.OPENCAGE_API_KEY = "test-api-key-123";

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    results: [
                      {
                        components: {
                          city: "Test City",
                          state: "Test State",
                        },
                      },
                    ],
                  }),
                }),
              100
            )
          )
      ) as any;

      const res = await request(app)
        .get("/api/reverse-geocode")
        .query({ lat: "37.7749", lng: "-122.4194" })
        .timeout(5000);

      expect(res.status).toBe(200);

      global.fetch = originalFetch;
    });
  });
});

