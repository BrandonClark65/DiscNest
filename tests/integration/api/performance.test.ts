import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import Listing from "@/models/Listing";
import User from "@/models/User";
import MessageThread from "@/models/MessageThread";
import Disc from "@/models/Disc";
import mongoose from "mongoose";

// Mock database connection
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: async () => {},
}));

// Mock error logger
vi.mock("@/lib/errorLogger", () => ({
  logError: vi.fn(),
}));

// Mock withErrorHandling
vi.mock("@/lib/withErrorHandling", () => ({
  withErrorHandling: (handler: any) => handler,
}));

// Mock sendMessageNotification to prevent actual emails during tests
vi.mock("@/lib/messages/sendMessageNotification", () => ({
  sendMessageNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock requireUser for authenticated routes
const mockRequireUser = vi.fn();
vi.mock("@/lib/auth/requireUser", () => ({
  requireUser: () => mockRequireUser(),
}));

// Mock withUserAuth
vi.mock("@/lib/auth/withUserAuth", () => ({
  withUserAuth: (handler: any) => async (req: Request, context?: any) => {
    try {
      const session = await mockRequireUser();
      return handler(req, session, context);
    } catch (err: any) {
      const { NextResponse } = await import("next/server");
      const status = err.name === "UnauthorizedError" ? 401 : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
  },
}));

// Mock getServerSession for messages endpoint
vi.mock("next-auth", async () => {
  const actual = await vi.importActual("next-auth");
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

// Mock Resend
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: vi.fn().mockResolvedValue({ id: "email-123" }),
    };
  },
}));

// Mock reverse geocoding
global.fetch = vi.fn().mockResolvedValue({
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
}) as any;

// Mock Cloudinary
vi.mock("cloudinary", () => ({
  v2: {
    uploader: {
      upload: vi.fn().mockResolvedValue({
        public_id: "test-public-id",
        secure_url: "https://test.com/image.jpg",
      }),
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

// Mock NSFW model
vi.mock("@/lib/nsfwModel", () => ({
  classifyImage: vi.fn().mockResolvedValue([
    { className: "Neutral", probability: 0.95 },
  ]),
}));

/**
 * Performance measurement helper
 * Measures the execution time of an async function
 * @param fn - Async function to measure
 * @returns Promise resolving to object with result and execution time in milliseconds
 */
function measureTime(fn: () => Promise<any>): Promise<{ result: any; time: number }> {
  return new Promise(async (resolve) => {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    resolve({ result, time });
  });
}

// Helper to create test user
async function createTestUser(overrides = {}) {
  return await User.create({
    name: "Test User",
    email: `test-${Date.now()}-${Math.random()}@test.com`,
    password: "hashed",
    shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    ...overrides,
  });
}

// Helper to create test listing
async function createTestListing(userId: mongoose.Types.ObjectId, overrides = {}) {
  return await Listing.create({
    title: "Test Disc",
    brand: "Innova",
    type: "Sell",
    condition: "New",
    userId,
    location: {
      type: "Point",
      coordinates: [-118 + Math.random() * 0.1, 34 + Math.random() * 0.1],
    },
    ...overrides,
  });
}

// Helper to create test disc
async function createTestDisc(overrides = {}) {
  return await Disc.create({
    name: "Test Disc",
    brand: "Innova",
    type: "Distance Driver",
    ...overrides,
  });
}

describe("Performance & Load Testing", () => {
  beforeAll(connectTestDb);
  afterEach(resetTestDb);
  afterAll(closeTestDb);

  /**
   * Response time benchmarks for key API endpoints
   * These tests ensure endpoints meet performance thresholds under various load conditions
   */
  describe("Response Time Benchmarks", () => {
    /**
     * Tests marketplace listings endpoint with small dataset (10 listings)
     * Verifies response time stays under 500ms for typical use case
     */
    test("GET /api/listings (marketplace) should respond within 500ms for small dataset", async () => {
      const user = await createTestUser();
      
      // Create 10 listings
      for (let i = 0; i < 10; i++) {
        await createTestListing(user._id, {
          title: `Disc ${i}`,
        });
      }

      const { result, time } = await measureTime(() =>
        request(app).get("/api/listings?mode=marketplace")
      );

      expect(result.status).toBe(200);
      expect(time).toBeLessThan(500); // Should be fast for small dataset
    });

    /**
     * Tests marketplace listings endpoint with medium dataset (100 listings)
     * Verifies response time stays under 2s for larger datasets
     * This tests pagination and query efficiency
     */
    test("GET /api/listings (marketplace) should respond within 2s for 100 listings", async () => {
      const user = await createTestUser();
      
      // Create 100 listings
      for (let i = 0; i < 100; i++) {
        await createTestListing(user._id, {
          title: `Disc ${i}`,
        });
      }

      const { result, time } = await measureTime(() =>
        request(app).get("/api/listings?mode=marketplace")
      );

      expect(result.status).toBe(200);
      expect(time).toBeLessThan(2000); // Should handle 100 listings reasonably
    });

    test("GET /api/user/discs/bag should respond within 300ms", async () => {
      const user = await createTestUser();
      mockRequireUser.mockResolvedValue({ user: { id: user._id.toString() } });

      // Create 20 discs in bag
      const discs = [];
      for (let i = 0; i < 20; i++) {
        const disc = await createTestDisc({ name: `Disc ${i}` });
        discs.push(disc._id);
      }
      user.bag = discs;
      await user.save();

      const { result, time } = await measureTime(() =>
        request(app).get("/api/user/discs/bag")
      );

      expect(result.status).toBe(200);
      expect(time).toBeLessThan(300);
    });

    /**
     * Tests messages endpoint with moderate number of threads (50)
     * Verifies efficient population and sorting of message threads
     * Tests database query optimization for user's message threads
     */
    test("GET /api/messages should respond within 500ms for 50 threads", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });

      // Create 50 message threads
      for (let i = 0; i < 50; i++) {
        await MessageThread.create({
          participants: [user1._id, user2._id],
          messages: [
            {
              sender: user1._id,
              content: `Message ${i}`,
              timestamp: new Date(),
            },
          ],
        });
      }

      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: user1._id.toString() },
      } as any);

      const { result, time } = await measureTime(() =>
        request(app).get("/api/messages")
      );

      expect(result.status).toBe(200);
      expect(time).toBeLessThan(500);
    });

    test("GET /api/discs should respond within 400ms", async () => {
      // Create 50 catalog discs (no userId)
      for (let i = 0; i < 50; i++) {
        await createTestDisc({
          name: `Catalog Disc ${i}`,
          userId: undefined,
        });
      }

      const { result, time } = await measureTime(() =>
        request(app).get("/api/discs")
      );

      expect(result.status).toBe(200);
      expect(time).toBeLessThan(400);
    });

    test("GET /api/recommendations should respond within 1s", async () => {
      const user = await createTestUser({
        armSpeed: "Medium",
        favoriteBrands: ["Innova"],
        stabilityPreference: "Straight",
      });
      mockRequireUser.mockResolvedValue({ user: { id: user._id.toString() } });

      // Create 100 catalog discs for recommendations
      for (let i = 0; i < 100; i++) {
        await createTestDisc({
          name: `Recommendation Disc ${i}`,
          brand: i % 2 === 0 ? "Innova" : "Discraft",
          userId: undefined,
        });
      }

      const { result, time } = await measureTime(() =>
        request(app).get("/api/recommendations")
      );

      expect(result.status).toBe(200);
      expect(time).toBeLessThan(1000);
    });
  });

  /**
   * Concurrent request handling tests
   * Verifies the API can handle multiple simultaneous requests without errors
   * Tests for race conditions and database connection pooling
   */
  describe("Concurrent Request Handling", () => {
    /**
     * Tests handling of 10 concurrent GET requests to listings endpoint
     * Verifies no race conditions occur and all requests complete successfully
     * Tests database connection pooling and query isolation
     */
    test("should handle 10 concurrent GET /api/listings requests", async () => {
      const user = await createTestUser();
      
      // Create 50 listings
      for (let i = 0; i < 50; i++) {
        await createTestListing(user._id);
      }

      const requests = Array.from({ length: 10 }, () =>
        request(app).get("/api/listings?mode=marketplace")
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - start;

      // All requests should succeed
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Should complete all requests in reasonable time (less than 5s total)
      expect(totalTime).toBeLessThan(5000);
    });

    test("should handle 20 concurrent GET /api/user/discs/bag requests", async () => {
      const users = [];
      
      // Create 20 users with bags
      for (let i = 0; i < 20; i++) {
        const user = await createTestUser({ email: `user${i}@test.com` });
        const discs = [];
        for (let j = 0; j < 10; j++) {
          const disc = await createTestDisc();
          discs.push(disc._id);
        }
        user.bag = discs;
        await user.save();
        users.push(user);
      }

      const requests = users.map((user) => {
        mockRequireUser.mockResolvedValueOnce({ user: { id: user._id.toString() } });
        return request(app).get("/api/user/discs/bag");
      });

      const start = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - start;

      // All requests should succeed
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Should complete all requests in reasonable time
      expect(totalTime).toBeLessThan(3000);
    });

    test("should handle concurrent GET and POST requests to /api/listings", async () => {
      const user = await createTestUser();
      mockRequireUser.mockResolvedValue({ user: { id: user._id.toString() } });

      // Create some initial listings
      for (let i = 0; i < 10; i++) {
        await createTestListing(user._id);
      }

      const getRequests = Array.from({ length: 5 }, () =>
        request(app).get("/api/listings?mode=marketplace")
      );

      const postRequests = Array.from({ length: 5 }, () =>
        request(app)
          .post("/api/listings")
          .send({
            title: "New Listing",
            brand: "Innova",
            type: "Sell",
            condition: "New",
            location: { lat: 34, lng: -118 },
          })
      );

      const allRequests = [...getRequests, ...postRequests];
      const start = Date.now();
      const responses = await Promise.all(allRequests);
      const totalTime = Date.now() - start;

      // All requests should succeed
      responses.forEach((res) => {
        expect([200, 201]).toContain(res.status);
      });

      // Should complete all requests in reasonable time
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe("Large Dataset Handling", () => {
    test("should handle 1000+ listings efficiently", async () => {
      const user = await createTestUser();
      
      // Create 1000 listings
      const listings = [];
      for (let i = 0; i < 1000; i++) {
        listings.push({
          title: `Disc ${i}`,
          brand: "Innova",
          type: "Sell",
          condition: "New",
          userId: user._id,
          location: {
            type: "Point",
            coordinates: [-118 + Math.random() * 0.1, 34 + Math.random() * 0.1],
          },
        });
      }

      // Insert in batches for better performance
      const batchSize = 100;
      for (let i = 0; i < listings.length; i += batchSize) {
        await Listing.insertMany(listings.slice(i, i + batchSize));
      }

      const { result, time } = await measureTime(() =>
        request(app).get("/api/listings?mode=marketplace&limit=20")
      );

      expect(result.status).toBe(200);
      expect(result.body.listings).toHaveLength(20); // Should paginate correctly
      expect(result.body.totalCount).toBe(1000);
      // Should still respond reasonably even with 1000 listings
      expect(time).toBeLessThan(3000);
    });

    test("should handle 500+ message threads efficiently", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });

      // Create 500 message threads
      const threads = [];
      for (let i = 0; i < 500; i++) {
        threads.push({
          participants: [user1._id, user2._id],
          messages: [
            {
              sender: user1._id,
              content: `Message ${i}`,
              timestamp: new Date(),
            },
          ],
        });
      }

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < threads.length; i += batchSize) {
        await MessageThread.insertMany(threads.slice(i, i + batchSize));
      }

      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: user1._id.toString() },
      } as any);

      const { result, time } = await measureTime(() =>
        request(app).get("/api/messages")
      );

      expect(result.status).toBe(200);
      expect(Array.isArray(result.body)).toBe(true);
      // Should handle 500 threads reasonably
      expect(time).toBeLessThan(2000);
    });

    test("should handle user with 100+ discs in bag efficiently", async () => {
      const user = await createTestUser();
      mockRequireUser.mockResolvedValue({ user: { id: user._id.toString() } });

      // Create 100 discs
      const discs = [];
      for (let i = 0; i < 100; i++) {
        const disc = await createTestDisc({ name: `Disc ${i}` });
        discs.push(disc._id);
      }

      user.bag = discs;
      await user.save();

      const { result, time } = await measureTime(() =>
        request(app).get("/api/user/discs/bag")
      );

      expect(result.status).toBe(200);
      expect(result.body.bag).toHaveLength(100);
      // Should handle 100 discs efficiently
      expect(time).toBeLessThan(500);
    });

    test("should handle marketplace search with 1000+ listings", async () => {
      const user = await createTestUser();
      
      // Create 1000 listings with various brands
      const brands = ["Innova", "Discraft", "Dynamic Discs", "MVP"];
      const listings = [];
      for (let i = 0; i < 1000; i++) {
        listings.push({
          title: `Disc ${i}`,
          brand: brands[i % brands.length],
          type: "Sell",
          condition: "New",
          userId: user._id,
          location: {
            type: "Point",
            coordinates: [-118 + Math.random() * 0.1, 34 + Math.random() * 0.1],
          },
        });
      }

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < listings.length; i += batchSize) {
        await Listing.insertMany(listings.slice(i, i + batchSize));
      }

      // Test search performance
      const { result, time } = await measureTime(() =>
        request(app).get("/api/listings?mode=marketplace&brand=Innova&limit=20")
      );

      expect(result.status).toBe(200);
      // Should filter by brand efficiently
      expect(time).toBeLessThan(2000);
    });
  });

  describe("Database Query Performance", () => {
    test("GET /api/listings should use efficient pagination", async () => {
      const user = await createTestUser();
      
      // Create 200 listings
      for (let i = 0; i < 200; i++) {
        await createTestListing(user._id, { title: `Disc ${i}` });
      }

      // Test that pagination limits results correctly
      const { result, time } = await measureTime(() =>
        request(app).get("/api/listings?mode=marketplace&page=1&limit=20")
      );

      expect(result.status).toBe(200);
      expect(result.body.listings).toHaveLength(20);
      expect(result.body.totalCount).toBe(200);
      expect(result.body.totalPages).toBe(10);
      // Should be fast with proper pagination
      expect(time).toBeLessThan(1000);
    });

    test("GET /api/messages should populate efficiently (no N+1 queries)", async () => {
      const user1 = await createTestUser({ email: "user1@test.com" });
      const user2 = await createTestUser({ email: "user2@test.com" });
      const listing = await createTestListing(user1._id);

      // Create 50 threads with listing references
      for (let i = 0; i < 50; i++) {
        await MessageThread.create({
          participants: [user1._id, user2._id],
          listingId: listing._id,
          messages: [
            {
              sender: user1._id,
              content: `Message ${i}`,
              timestamp: new Date(),
            },
          ],
        });
      }

      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: user1._id.toString() },
      } as any);

      // Monitor query count (this is a simplified check)
      const { result, time } = await measureTime(() =>
        request(app).get("/api/messages")
      );

      expect(result.status).toBe(200);
      expect(result.body).toHaveLength(50);
      // Should populate efficiently without N+1 queries
      expect(time).toBeLessThan(1000);
    });

    test("GET /api/user/discs/bag should populate efficiently", async () => {
      const user = await createTestUser();
      mockRequireUser.mockResolvedValue({ user: { id: user._id.toString() } });

      // Create 50 discs
      const discs = [];
      for (let i = 0; i < 50; i++) {
        const disc = await createTestDisc({ name: `Disc ${i}` });
        discs.push(disc._id);
      }

      user.bag = discs;
      await user.save();

      const { result, time } = await measureTime(() =>
        request(app).get("/api/user/discs/bag")
      );

      expect(result.status).toBe(200);
      expect(result.body.bag).toHaveLength(50);
      // Should populate all discs efficiently
      expect(time).toBeLessThan(500);
    });

    test("GET /api/listings with geo query should use index efficiently", async () => {
      const user = await createTestUser();
      
      // Create 100 listings with locations
      for (let i = 0; i < 100; i++) {
        await createTestListing(user._id, {
          location: {
            type: "Point",
            coordinates: [-118 + (Math.random() - 0.5) * 0.1, 34 + (Math.random() - 0.5) * 0.1],
          },
        });
      }

      // Test geo query performance (should use 2dsphere index)
      const { result, time } = await measureTime(() =>
        request(app).get("/api/listings?mode=marketplace&lat=34&lng=-118&limit=20")
      );

      expect(result.status).toBe(200);
      // Geo queries should be efficient with proper index
      expect(time).toBeLessThan(1500);
    });
  });

  describe("Stress Testing", () => {
    test("should handle rapid sequential requests", async () => {
      const user = await createTestUser();
      
      // Create initial data
      for (let i = 0; i < 50; i++) {
        await createTestListing(user._id);
      }

      // Make 50 rapid sequential requests
      const start = Date.now();
      for (let i = 0; i < 50; i++) {
        const res = await request(app).get("/api/listings?mode=marketplace");
        expect(res.status).toBe(200);
      }
      const totalTime = Date.now() - start;
      const avgTime = totalTime / 50;

      // Average response time should be reasonable
      expect(avgTime).toBeLessThan(500);
    });

    test("should handle mixed load (reads and writes)", async () => {
      const user = await createTestUser();
      mockRequireUser.mockResolvedValue({ user: { id: user._id.toString() } });

      // Create initial listings
      for (let i = 0; i < 20; i++) {
        await createTestListing(user._id);
      }

      // Mix of reads and writes
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(request(app).get("/api/listings?mode=marketplace"));
        operations.push(
          request(app)
            .post("/api/listings")
            .send({
              title: `New Listing ${i}`,
              brand: "Innova",
              type: "Sell",
              condition: "New",
              location: { lat: 34, lng: -118 },
            })
        );
      }

      const start = Date.now();
      const responses = await Promise.all(operations);
      const totalTime = Date.now() - start;

      // All should succeed
      responses.forEach((res) => {
        expect([200, 201]).toContain(res.status);
      });

      // Should handle mixed load efficiently
      expect(totalTime).toBeLessThan(5000);
    });
  });
});

