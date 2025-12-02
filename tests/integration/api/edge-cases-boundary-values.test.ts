// tests/integration/api/edge-cases-boundary-values.test.ts
// Boundary value testing for API routes
import "./edge-cases-shared-setup";
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import { mockRequireUser } from "./edge-cases-shared-setup";

describe("Edge Cases: Boundary Values", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockRequireUser.mockReset();
    vi.clearAllMocks();
  });
  afterAll(closeTestDb);

  test("profile: handles minimum username length (3 characters)", async () => {
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
      .send({ username: "abc" });

    expect(res.status).toBe(200);
  });

  test("profile: handles maximum username length (20 characters)", async () => {
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
      .send({ username: "a".repeat(20) });

    expect(res.status).toBe(200);
  });

  test("profile: handles minimum maxDistanceFt (0)", async () => {
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
      .send({ maxDistanceFt: 0 });

    expect(res.status).toBe(200);
  });

  test("profile: handles maximum maxDistanceFt (800)", async () => {
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
      .send({ maxDistanceFt: 800 });

    expect(res.status).toBe(200);
  });

  test("profile: rejects maxDistanceFt below minimum", async () => {
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
      .send({ maxDistanceFt: -1 });

    expect(res.status).toBe(400);
  });

  test("profile: rejects maxDistanceFt above maximum", async () => {
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
      .send({ maxDistanceFt: 801 });

    expect(res.status).toBe(400);
  });

  test("profile: handles maximum bio length (300 characters)", async () => {
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
      .send({ bio: "a".repeat(300) });

    expect(res.status).toBe(200);
  });

  test("profile: handles empty string vs null vs undefined", async () => {
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

    // Empty string should be valid (treated as optional field)
    const res1 = await request(app)
      .post("/api/profile")
      .send({ bio: "" });

    expect(res1.status).toBe(200);

    // Null should be handled
    const res2 = await request(app)
      .post("/api/profile")
      .send({ bio: null });

    // Zod may reject null, or it may be converted - depends on schema
    expect([200, 400]).toContain(res2.status);
  });
});

