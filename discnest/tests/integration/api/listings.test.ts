import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import Listing from "@/models/Listing";
import User from "@/models/User";
import mongoose from "mongoose";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";

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

describe("GET /api/listings", () => {
  beforeAll(connectTestDb);
  afterEach(resetTestDb);
  afterAll(closeTestDb);

  test("returns empty array initially", async () => {
    const res = await request(app).get("/api/listings");

    expect(res.status).toBe(200);
    expect(res.body.listings).toEqual([]);
    expect(res.body.totalPages).toBe(0);
    expect(res.body.totalCount).toBe(0);
  });

  test("returns listings with pagination", async () => {
    const user = await User.create({
      name: "Seller",
      email: "seller@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    await Listing.create({
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    const res = await request(app).get("/api/listings?page=1&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].title).toBe("Test Disc");
    expect(res.body.totalCount).toBe(1);
  });

  test("filters by brand", async () => {
    const user = await User.create({
      name: "Seller",
      email: "seller@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    await Listing.create({
      title: "Innova Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    await Listing.create({
      title: "Discraft Disc",
      brand: "Discraft",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    const res = await request(app).get("/api/listings?brand=Innova");

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].brand).toBe("Innova");
  });

  test("filters by condition", async () => {
    const user = await User.create({
      name: "Seller",
      email: "seller@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    await Listing.create({
      title: "New Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    await Listing.create({
      title: "Used Disc",
      brand: "Innova",
      type: "Sell",
      condition: "Used",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    const res = await request(app).get("/api/listings?condition=New");

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].condition).toBe("New");
  });

  test("searches by title", async () => {
    const user = await User.create({
      name: "Seller",
      email: "seller@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    await Listing.create({
      title: "Buzzz",
      brand: "Discraft",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    await Listing.create({
      title: "Teebird",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    const res = await request(app).get("/api/listings?search=Buzzz");

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].title).toBe("Buzzz");
  });

  test("requires auth for myListings mode", async () => {
    mockRequireUser.mockRejectedValueOnce(new Error("Unauthorized"));

    const res = await request(app).get("/api/listings?mode=myListings");

    expect(res.status).toBe(401);
  });

  test("returns user's listings in myListings mode", async () => {
    const user = await User.create({
      name: "Seller",
      email: "seller@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const otherUser = await User.create({
      name: "Other",
      email: "other@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    await Listing.create({
      title: "My Listing",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    await Listing.create({
      title: "Other Listing",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      userId: otherUser._id,
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/listings?mode=myListings");

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].title).toBe("My Listing");
  });
});

describe("POST /api/listings", () => {
  beforeAll(connectTestDb);
  afterEach(() => {
    resetTestDb();
    mockRequireUser.mockReset();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/listings")
      .send({ title: "Test", brand: "Innova", type: "Sell", condition: "New" });

    expect(res.status).toBe(401);
  });

  test("creates listing with valid data", async () => {
    const user = await User.create({
      name: "Seller",
      email: "seller@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const listingData = {
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      price: 25,
      description: "Great disc",
      location: {
        type: "Point",
        coordinates: [-118, 34],
      },
    };

    const res = await request(app)
      .post("/api/listings")
      .send(listingData);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test Disc");
    expect(res.body.userId).toBe(user._id.toString());

    const listing = await Listing.findById(res.body._id);
    expect(listing).toBeTruthy();
    expect(listing?.city).toBe("Test City");
    expect(listing?.state).toBe("Test State");
  });

  test("creates listing with pendingReview flag", async () => {
    const user = await User.create({
      name: "Seller",
      email: "seller@test.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const listingData = {
      title: "Test Disc",
      brand: "Innova",
      type: "Sell",
      condition: "New",
      pendingReview: true,
      imageUrls: ["http://example.com/image.jpg"],
    };

    const res = await request(app)
      .post("/api/listings")
      .send(listingData);

    expect(res.status).toBe(201);
    const listing = await Listing.findById(res.body._id);
    expect(listing?.pendingReview).toBe(true);
  });
});
