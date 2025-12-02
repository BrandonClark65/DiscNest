// tests/integration/api/user-utility-routes.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import { setupStandardMocks, mockRequireUser, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("POST /api/user/discs/share", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).post("/api/user/discs/share");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized: Unauthorized");
  });

  test("returns 404 if user not found", async () => {
    const fakeUserId = "507f1f77bcf86cd799439011";

    mockRequireUser.mockResolvedValueOnce({
      user: { id: fakeUserId },
    });

    const res = await request(app).post("/api/user/discs/share");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("creates shareableBagId if user doesn't have one", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    });

    // shareableBagId might be null or undefined when not set
    expect(user.shareableBagId == null).toBe(true);

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/share")
      .set("origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.body.shareUrl).toBeDefined();
    expect(res.body.shareableBagId).toBeDefined();
    expect(res.body.shareUrl).toContain("/share/bag/");
    expect(res.body.shareUrl).toContain(res.body.shareableBagId);

    // Verify it was saved to database
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.shareableBagId).toBe(res.body.shareableBagId);
  });

  test("returns existing shareableBagId if user already has one", async () => {
    const existingId = "existing-share-id-123";
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: existingId,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/share")
      .set("origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.body.shareableBagId).toBe(existingId);
    expect(res.body.shareUrl).toContain(existingId);
  });

  test("generates valid UUID format for shareableBagId", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/share")
      .set("origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.body.shareableBagId).toBeDefined();
    
    // UUID v4 format: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(res.body.shareableBagId).toMatch(uuidRegex);
  });

  test("uses origin header for base URL if provided", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/share")
      .set("origin", "https://example.com");

    expect(res.status).toBe(200);
    expect(res.body.shareUrl).toContain("https://example.com");
    expect(res.body.shareUrl).toContain("/share/bag/");
  });

  test("uses NEXT_PUBLIC_BASE_URL or localhost as fallback", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).post("/api/user/discs/share");

    expect(res.status).toBe(200);
    expect(res.body.shareUrl).toBeDefined();
    // Should fall back to localhost or env var
    expect(res.body.shareUrl).toMatch(/^https?:\/\//);
    expect(res.body.environment).toBeDefined();
  });

  test("returns environment in response", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/share")
      .set("origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.body.environment).toBeDefined();
  });
});

describe("POST /api/user/onboarded", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
  });
  afterAll(closeTestDb);

  test("requires email in request body", async () => {
    const res = await request(app)
      .post("/api/user/onboarded")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing email");
  });

  test("updates hasOnboarded to true for user with matching email", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      hasOnboarded: false,
    });

    expect(user.hasOnboarded).toBe(false);

    const res = await request(app)
      .post("/api/user/onboarded")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it was updated in database
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.hasOnboarded).toBe(true);
  });

  test("updates hasOnboarded even if user already has it set to true", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      hasOnboarded: true,
    });

    const res = await request(app)
      .post("/api/user/onboarded")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.hasOnboarded).toBe(true);
  });

  test("handles non-existent email gracefully", async () => {
    const res = await request(app)
      .post("/api/user/onboarded")
      .send({ email: "nonexistent@example.com" });

    // The route doesn't check if user exists, just updates
    // So it will return success even if no user matches
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("returns success for empty email string", async () => {
    // Empty string is falsy, so should return error
    const res = await request(app)
      .post("/api/user/onboarded")
      .send({ email: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing email");
  });
});

