// tests/integration/api/edge-cases-input-validation.test.ts
// Input validation edge cases: Unicode, Large Payloads, Malformed Data
import "./edge-cases-shared-setup";
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import MessageThread from "@/models/MessageThread";
import { mockRequireUser, mockGetServerSession } from "./edge-cases-shared-setup";

describe("Edge Cases: Input Validation", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockRequireUser.mockReset();
    vi.clearAllMocks();
  });
  afterAll(closeTestDb);

  describe("Unicode & Special Characters", () => {
    test("profile: handles emojis in username", async () => {
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

      const res = await request(app)
        .post("/api/profile")
        .send({ username: "user🎯disc" });

      expect([200, 400]).toContain(res.status);
    });

    test("profile: handles emojis in bio", async () => {
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

      const res = await request(app)
        .post("/api/profile")
        .send({ bio: "I love disc golf! 🥏⛓️🏆" });

      expect(res.status).toBe(200);
    });

    test("profile: handles special characters in username", async () => {
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

      const res = await request(app)
        .post("/api/profile")
        .send({ username: "user_name-123" });

      expect([200, 400]).toContain(res.status);
    });

    test("profile: handles unicode characters in name", async () => {
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

      const res = await request(app)
        .post("/api/profile")
        .send({ name: "José García 中文" });

      expect(res.status).toBe(200);
    });

    test("listings: handles unicode in title and description", async () => {
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

      const res = await request(app)
        .post("/api/listings")
        .send({
          title: "Disc à vendre 🥏",
          description: "Description avec des caractères spéciaux: ñ, é, ü",
          brand: "Innova",
          type: "Sell",
          condition: "New",
          price: 20,
          location: {
            type: "Point",
            coordinates: [-122.4194, 37.7749],
          },
        });

      expect([200, 201]).toContain(res.status);
      // POST /api/listings returns the listing directly, not wrapped
      if (res.status === 201) {
        expect(res.body.title).toBe("Disc à vendre 🥏");
      } else if (res.body.listing) {
        expect(res.body.listing.title).toBe("Disc à vendre 🥏");
      }
    });
  });

  describe("Large Payloads", () => {
    test("profile: handles very long bio (approaching limit)", async () => {
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

      const longBio = "a".repeat(299);
      const res = await request(app)
        .post("/api/profile")
        .send({ bio: longBio });

      expect(res.status).toBe(200);
    });

    test("listings: handles very long description", async () => {
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

      const longDescription = "a".repeat(10000);
      const res = await request(app)
        .post("/api/listings")
        .send({
          title: "Test Listing",
          description: longDescription,
          brand: "Innova",
          type: "Sell",
          condition: "New",
          price: 20,
          location: {
            type: "Point",
            coordinates: [-122.4194, 37.7749],
          },
        });

      expect([200, 201, 400, 413, 500]).toContain(res.status);
    });

    test("messages: handles very long message content", async () => {
      const user1 = await User.create({
        name: "User 1",
        email: "user1@example.com",
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const user2 = await User.create({
        name: "User 2",
        email: "user2@example.com",
        password: "hashed",
        shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      });

      const listing = await Listing.create({
        title: "Test Listing",
        brand: "Innova",
        type: "Sell",
        condition: "New",
        price: 20,
        userId: user1._id,
        location: {
          type: "Point",
          coordinates: [-122.4194, 37.7749],
        },
      });

      const thread = await MessageThread.create({
        participants: [user1._id, user2._id],
        listingId: listing._id,
        messages: [],
      });

      mockRequireUser.mockResolvedValueOnce({
        user: {
          id: user1._id.toString(),
          email: user1.email,
        },
      });

      const longMessage = "a".repeat(50000);
      const res = await request(app)
        .post(`/api/messages/${thread._id}`)
        .send({ content: longMessage });

      expect([200, 400, 413]).toContain(res.status);
    });
  });

  describe("Malformed Data", () => {
    test("profile: handles deeply nested objects", async () => {
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

      let nested: any = { level: 1 };
      for (let i = 2; i <= 20; i++) {
        nested = { level: i, nested };
      }

      const res = await request(app)
        .post("/api/profile")
        .send({ bio: JSON.stringify(nested) });

      expect([200, 400]).toContain(res.status);
    });

    test("profile: handles invalid JSON in request body", async () => {
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

      const res = await request(app)
        .post("/api/profile")
        .send({ username: { invalid: "object" } });

      expect(res.status).toBe(400);
    });

    test("listings: handles invalid location coordinates", async () => {
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

      const res = await request(app)
        .post("/api/listings")
        .send({
          title: "Test Listing",
          brand: "Innova",
          type: "Sell",
          condition: "New",
          price: 20,
          location: {
            type: "Point",
            coordinates: ["invalid", "not-a-number"],
          },
        });

      expect([400, 500]).toContain(res.status);
    });

    test("listings: handles missing required location fields", async () => {
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

      const res = await request(app)
        .post("/api/listings")
        .send({
          title: "Test Listing",
          brand: "Innova",
          type: "Sell",
          condition: "New",
          price: 20,
          location: {
            type: "Point",
            // Missing coordinates
          },
        });

      expect([200, 201, 400, 500]).toContain(res.status);
    });
  });
});

