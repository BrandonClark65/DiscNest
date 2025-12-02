// tests/integration/api/opencage-failures.test.ts
// Tests for OpenCage API failure handling
import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import { setupStandardMocks, mockRequireUser, mockFetch, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("OpenCage API Failures", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(() => {
    resetAllMocks();
    // Ensure global.fetch uses our mock
    global.fetch = mockFetch as any;
    process.env.OPENCAGE_API_KEY = "test-api-key-123";
  });

  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });

  afterAll(() => {
    closeTestDb();
  });

  describe("OpenCage API Failures", () => {
    test("handles OpenCage API network error in reverse-geocode", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const res = await request(app)
        .get("/api/reverse-geocode")
        .query({ lat: "37.7749", lng: "-122.4194" });

      expect(res.status).toBe(500);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test("handles OpenCage API rate limiting", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({
          status: {
            code: 429,
            message: "Rate limit exceeded",
          },
        }),
      });

      const res = await request(app)
        .get("/api/reverse-geocode")
        .query({ lat: "37.7749", lng: "-122.4194" });

      expect(res.status).toBe(200);
      expect(res.body.city).toBe("");
      expect(res.body.state).toBe("");
    });

    test("handles OpenCage API invalid API key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({
          status: {
            code: 403,
            message: "Invalid API key",
          },
        }),
      });

      const res = await request(app)
        .get("/api/reverse-geocode")
        .query({ lat: "37.7749", lng: "-122.4194" });

      expect(res.status).toBe(200);
      expect(res.body.city).toBe("");
      expect(res.body.state).toBe("");
    });

    test("handles OpenCage API timeout", async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 30000);
          })
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Test timeout")), 1000);
      });

      const geocodePromise = request(app)
        .get("/api/reverse-geocode")
        .query({ lat: "37.7749", lng: "-122.4194" });

      try {
        await Promise.race([geocodePromise, timeoutPromise]);
      } catch (err) {
        // Expected in test scenario
      }
    }, 2000);

    test("handles OpenCage API failure in listing creation", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "hashed",
      });

      mockRequireUser.mockResolvedValueOnce({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });

      mockFetch.mockRejectedValueOnce(new Error("OpenCage API error"));

      const res = await request(app)
        .post("/api/listings")
        .set("Cookie", "session=test")
        .send({
          title: "Test Disc",
          brand: "Innova",
          type: "Sell",
          condition: "New",
          price: 25,
          description: "Great disc",
          location: {
            type: "Point",
            coordinates: [-122.4194, 37.7749],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Test Disc");

      const listing = await Listing.findById(res.body._id);
      expect(listing).toBeDefined();
    });

    test("handles OpenCage API invalid response format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: {
            code: 200,
            message: "OK",
          },
        }),
      });

      const res = await request(app)
        .get("/api/reverse-geocode")
        .query({ lat: "37.7749", lng: "-122.4194" });

      expect(res.status).toBe(200);
      expect(res.body.city).toBe("");
      expect(res.body.state).toBe("");
    });
  });
});

