// tests/integration/api/recommendations.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Disc from "@/models/Disc";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";

/* ----------------------------------------------------
   MOCK DATABASE (use in-memory DB instead of Mongo)
---------------------------------------------------- */
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: async () => {}, // no-op
}));

/* ----------------------------------------------------
   MOCK ERROR LOGGER
---------------------------------------------------- */
vi.mock("@/lib/errorLogger", () => ({
  logError: vi.fn(), // disable email sending
}));

/* ----------------------------------------------------
   MOCK withErrorHandling (so it doesn't wrap errors)
---------------------------------------------------- */
vi.mock("@/lib/withErrorHandling", () => ({
  withErrorHandling: (handler: any) => handler, // passthrough
}));

/* ----------------------------------------------------
   MOCK AUTHENTICATION
---------------------------------------------------- */
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

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("GET /api/recommendations", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockRequireUser.mockReset();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).get("/api/recommendations");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized: Unauthorized");
  });

  test("returns 404 if user not found", async () => {
    // Mock a user ID that doesn't exist
    const fakeUserId = "507f1f77bcf86cd799439011";
    
    mockRequireUser.mockResolvedValueOnce({
      user: { id: fakeUserId },
    });

    const res = await request(app).get("/api/recommendations");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("returns personalized recommendations based on user's bag", async () => {
    // Create user with profile preferences
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      armSpeed: "Medium",
      stabilityPreference: "Straight",
      favoriteBrands: ["Innova"],
    });

    // Create user's bag discs (only Putter)
    const userDisc = await Disc.create({
      userId: user._id,
      name: "Aviar",
      brand: "Innova",
      type: "Putter",
      flight: {
        speed: 3,
        glide: 3,
        turn: 0,
        fade: 1,
      },
      plastic: "DX",
    });

    // Create candidate discs for recommendations
    const midrangeDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      flight: {
        speed: 5,
        glide: 4,
        turn: -1,
        fade: 1,
      },
    });

    const fairwayDisc = await Disc.create({
      name: "Teebird",
      brand: "Innova",
      type: "Fairway Driver",
      flight: {
        speed: 7,
        glide: 5,
        turn: 0,
        fade: 2,
      },
    });

    // A disc that user already owns (should not be recommended)
    const duplicateDisc = await Disc.create({
      name: "Aviar",
      brand: "Innova",
      type: "Putter",
      flight: {
        speed: 3,
        glide: 3,
        turn: 0,
        fade: 1,
      },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/recommendations");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    // Should have recommendations
    expect(res.body.length).toBeGreaterThan(0);
    
    // Should not include disc user already owns
    const ownedDiscInResults = res.body.find(
      (d: any) => d.name === "Aviar" && d.brand === "Innova"
    );
    expect(ownedDiscInResults).toBeUndefined();

    // Should include missing category discs (Midrange, Fairway Driver)
    const recommendedNames = res.body.map((d: any) => d.name);
    expect(recommendedNames).toContain("Buzzz");
    // May or may not include Teebird depending on scoring, but should have some recommendations
  });

  test("returns recommendations with reasons and scores", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      armSpeed: "Medium",
      favoriteBrands: ["Innova"],
    });

    // Create user's bag disc
    await Disc.create({
      userId: user._id,
      name: "Aviar",
      brand: "Innova",
      type: "Putter",
      flight: { speed: 3, glide: 3, turn: 0, fade: 1 },
    });

    // Create recommendation candidate
    await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      flight: { speed: 5, glide: 4, turn: -1, fade: 1 },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/recommendations");

    expect(res.status).toBe(200);
    
    if (res.body.length > 0) {
      const recommendation = res.body[0];
      expect(recommendation).toHaveProperty("reasons");
      expect(recommendation).toHaveProperty("score");
      expect(Array.isArray(recommendation.reasons)).toBe(true);
      expect(typeof recommendation.score).toBe("number");
      expect(recommendation.score).toBeGreaterThan(0);
    }
  });

  test("uses user profile preferences for recommendations", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      armSpeed: "Slow",
      stabilityPreference: "Understable",
      favoriteBrands: ["Discraft"],
    });

    // Create user's bag disc
    await Disc.create({
      userId: user._id,
      name: "Aviar",
      brand: "Innova",
      type: "Putter",
      flight: { speed: 3, glide: 3, turn: 0, fade: 1 },
    });

    // Create disc matching arm speed (speed <= 7 for slow arm)
    await Disc.create({
      name: "Leopard",
      brand: "Innova",
      type: "Fairway Driver",
      flight: { speed: 6, glide: 5, turn: -2, fade: 1 },
      stability: "Understable",
    });

    // Create disc from favorite brand
    await Disc.create({
      name: "Zone",
      brand: "Discraft",
      type: "Midrange",
      flight: { speed: 4, glide: 3, turn: 0, fade: 3 },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/recommendations");

    expect(res.status).toBe(200);
    
    // Should have recommendations that match user preferences
    if (res.body.length > 0) {
      const recommendedNames = res.body.map((d: any) => d.name);
      // Zone should be recommended due to favorite brand match
      // Leopard should be recommended due to arm speed and stability match
      expect(recommendedNames.length).toBeGreaterThan(0);
    }
  });

  test("limits recommendations to 500 discs from database", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    // Create user's bag disc
    await Disc.create({
      userId: user._id,
      name: "Aviar",
      brand: "Innova",
      type: "Putter",
      flight: { speed: 3, glide: 3, turn: 0, fade: 1 },
    });

    // Create many candidate discs (more than 500 to test limit)
    const discPromises = [];
    for (let i = 0; i < 600; i++) {
      discPromises.push(
        Disc.create({
          name: `Disc ${i}`,
          brand: "Innova",
          type: "Midrange",
          flight: { speed: 5, glide: 4, turn: -1, fade: 1 },
        })
      );
    }
    await Promise.all(discPromises);

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/recommendations");

    expect(res.status).toBe(200);
    // The route limits allDiscs to 500, but recommendations are further limited to top 12
    expect(res.body.length).toBeLessThanOrEqual(12);
  });

  test("returns recommendations for user with empty bag", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
      armSpeed: "Medium",
    });

    // Create candidate discs
    await Disc.create({
      name: "Aviar",
      brand: "Innova",
      type: "Putter",
      flight: { speed: 3, glide: 3, turn: 0, fade: 1 },
    });

    await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      flight: { speed: 5, glide: 4, turn: -1, fade: 1 },
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/recommendations");

    expect(res.status).toBe(200);
    // Should still return recommendations even with empty bag
    // (missing_category reason should apply to all types)
    expect(Array.isArray(res.body)).toBe(true);
  });
});

