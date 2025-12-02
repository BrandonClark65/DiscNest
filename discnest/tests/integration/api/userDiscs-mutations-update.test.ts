import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Disc from "@/models/Disc";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import { setupStandardMocks, mockRequireUser, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();

describe("POST /api/user/discs/update", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: "disc123" });

    expect(res.status).toBe(401);
  });

  test("validates discId is provided", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).post("/api/user/discs/update").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing disc ID");
  });

  test("validates disc ownership", async () => {
    const user1 = await User.create({
      name: "User1",
      email: `user1-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const user2 = await User.create({
      name: "User2",
      email: `user2-${Date.now()}@test.com`,
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const user2Disc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user2._id,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user1._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: user2Disc._id.toString() });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized or disc not found");
  });

  test("returns 401 for non-existent disc", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: "507f1f77bcf86cd799439011" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized or disc not found");
  });

  test("updates disc plastic", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
      plastic: "DX",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), plastic: "Star" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.disc.plastic).toBe("Star");

    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.plastic).toBe("Star");
  });

  test("updates disc wearLevel", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
      wearLevel: 0,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), wearLevel: 75 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.disc.wearLevel).toBe(75);

    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.wearLevel).toBe(75);
  });

  test("validates wearLevel range - rejects negative", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), wearLevel: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("wearLevel must be a number between 0 and 100");
  });

  test("validates wearLevel range - rejects over 100", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), wearLevel: 101 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("wearLevel must be a number between 0 and 100");
  });

  test("accepts wearLevel at boundaries (0 and 100)", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
      wearLevel: 50,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Test 0
    const res1 = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), wearLevel: 0 });

    expect(res1.status).toBe(200);
    expect(res1.body.disc.wearLevel).toBe(0);

    // Mock user again for second request
    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Test 100
    const res2 = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), wearLevel: 100 });

    expect(res2.status).toBe(200);
    expect(res2.body.disc.wearLevel).toBe(100);
  });

  test("updates disc weight", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), weight: 175 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.disc.weight).toBe(175);

    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.weight).toBe(175);
  });

  test("validates weight range - rejects below 100", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), weight: 99 });

    expect(res.status).toBe(200);
    // Weight validation silently fails (doesn't update if invalid)
    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.weight).not.toBe(99);
  });

  test("validates weight range - rejects above 200", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), weight: 201 });

    expect(res.status).toBe(200);
    // Weight validation silently fails (doesn't update if invalid)
    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.weight).not.toBe(201);
  });

  test("accepts weight at boundaries (100 and 200)", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Test 100
    const res1 = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), weight: 100 });

    expect(res1.status).toBe(200);
    expect(res1.body.disc.weight).toBe(100);

    // Reset for next test
    await Disc.findByIdAndUpdate(userDisc._id, { weight: null });

    // Mock user again for second request
    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Test 200
    const res2 = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), weight: 200 });

    expect(res2.status).toBe(200);
    expect(res2.body.disc.weight).toBe(200);
  });

  test("handles empty weight string", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
      weight: 175,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), weight: "" });

    expect(res.status).toBe(200);
    // Empty string should not update weight
    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.weight).toBe(175);
  });

  test("updates disc notes", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
      notes: "",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), notes: "My favorite disc!" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.disc.notes).toBe("My favorite disc!");

    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.notes).toBe("My favorite disc!");
  });

  test("updates disc color", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
      color: "#ffffff",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({ discId: userDisc._id.toString(), color: "#ff0000" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.disc.color).toBe("#ff0000");

    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.color).toBe("#ff0000");
  });

  test("handles partial updates - multiple fields", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
      plastic: "DX",
      wearLevel: 0,
      notes: "",
      color: "#ffffff",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/update")
      .send({
        discId: userDisc._id.toString(),
        plastic: "Star",
        wearLevel: 50,
        notes: "Great disc!",
        color: "#0000ff",
        weight: 175,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.disc.plastic).toBe("Star");
    expect(res.body.disc.wearLevel).toBe(50);
    expect(res.body.disc.notes).toBe("Great disc!");
    expect(res.body.disc.color).toBe("#0000ff");
    expect(res.body.disc.weight).toBe(175);

    const updatedDisc = await Disc.findById(userDisc._id);
    expect(updatedDisc?.plastic).toBe("Star");
    expect(updatedDisc?.wearLevel).toBe(50);
    expect(updatedDisc?.notes).toBe("Great disc!");
    expect(updatedDisc?.color).toBe("#0000ff");
    expect(updatedDisc?.weight).toBe(175);
  });
});

