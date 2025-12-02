import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Disc from "@/models/Disc";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import { setupStandardMocks, mockRequireUser, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();

// Mock recalcDiscCount
vi.mock("@/lib/updateDiscCount", () => ({
  recalcDiscCount: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/user/discs/add", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/user/discs/add")
      .send({ discId: "disc123", target: "bag" });

    expect(res.status).toBe(401);
  });

  test("validates required fields", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).post("/api/user/discs/add").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing or invalid fields");
  });

  test("adds disc to bag", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const catalogDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/add")
      .send({ discId: catalogDisc._id.toString(), target: "bag" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id).populate("bag");
    expect(updatedUser?.bag).toHaveLength(1);
    expect(updatedUser?.bag[0].name).toBe("Buzzz");
  });

  test("adds disc to shelf", async () => {
    const user = await User.create({
      name: "User",
      email: `user-shelf-${Date.now()}@test.com`,
      password: "hashed",
    });

    const catalogDisc = await Disc.create({
      name: "Teebird",
      brand: "Innova",
      type: "Fairway Driver",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/add")
      .send({ discId: catalogDisc._id.toString(), target: "shelf" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id).populate("discShelf");
    expect(updatedUser?.discShelf).toHaveLength(1);
  });

  test("returns 404 for non-existent catalog disc", async () => {
    const user = await User.create({
      name: "User",
      email: `user-404-${Date.now()}@test.com`,
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/add")
      .send({ discId: "507f1f77bcf86cd799439011", target: "bag" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Disc not found in catalog");
  });
});

describe("POST /api/user/discs/delete", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/user/discs/delete")
      .send({ discId: "disc123", target: "bag" });

    expect(res.status).toBe(401);
  });

  test("validates required fields", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).post("/api/user/discs/delete").send({});

    expect(res.status).toBe(400);
  });

  test("deletes disc from bag", async () => {
    const user = await User.create({
      name: "User",
      email: `user-delete-${Date.now()}@test.com`,
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    user.bag = [userDisc._id];
    await user.save();

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/delete")
      .send({ discId: userDisc._id.toString(), target: "bag" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.bag).toHaveLength(0);

    const deletedDisc = await Disc.findById(userDisc._id);
    expect(deletedDisc).toBeNull();
  });
});

describe("POST /api/user/discs/move", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/user/discs/move")
      .send({ discId: "disc123", from: "bag", to: "discShelf" });

    expect(res.status).toBe(401);
  });

  test("validates required fields", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).post("/api/user/discs/move").send({});

    expect(res.status).toBe(400);
  });

  test("moves disc from bag to shelf", async () => {
    const user = await User.create({
      name: "User",
      email: `user-move-${Date.now()}@test.com`,
      password: "hashed",
    });

    const userDisc = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    user.bag = [userDisc._id];
    await user.save();

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/move")
      .send({ discId: userDisc._id.toString(), from: "bag", to: "discShelf" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.bag).toHaveLength(0);
    expect(updatedUser?.discShelf).toHaveLength(1);
  });

  test("returns 404 if disc not in source", async () => {
    const user = await User.create({
      name: "User",
      email: `user-404-move-${Date.now()}@test.com`,
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
      .post("/api/user/discs/move")
      .send({ discId: userDisc._id.toString(), from: "bag", to: "discShelf" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Disc not found in source");
  });
});

describe("POST /api/user/discs/reorder", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: [], zone: "bag" });

    expect(res.status).toBe(401);
  });

  test("validates orderedIds is an array", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: "not-an-array", zone: "bag" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request body");
  });

  test("validates zone is provided", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request body");
  });

  test("validates zone is 'bag' or 'shelf'", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: [], zone: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid zone value");
  });

  test("returns 404 if user not found", async () => {
    mockRequireUser.mockResolvedValueOnce({
      user: { id: "507f1f77bcf86cd799439011" },
    });

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: [], zone: "bag" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("reorders discs in bag", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const disc1 = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    const disc2 = await Disc.create({
      name: "Teebird",
      brand: "Innova",
      type: "Fairway Driver",
      userId: user._id,
    });

    const disc3 = await Disc.create({
      name: "Destroyer",
      brand: "Innova",
      type: "Distance Driver",
      userId: user._id,
    });

    // Initial order: disc1, disc2, disc3
    user.bag = [disc1._id, disc2._id, disc3._id];
    await user.save();

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Reorder to: disc3, disc1, disc2
    const newOrder = [
      disc3._id.toString(),
      disc1._id.toString(),
      disc2._id.toString(),
    ];

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: newOrder, zone: "bag" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.bag.map((id: any) => id.toString())).toEqual(newOrder);
  });

  test("reorders discs in shelf", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const disc1 = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    const disc2 = await Disc.create({
      name: "Teebird",
      brand: "Innova",
      type: "Fairway Driver",
      userId: user._id,
    });

    const disc3 = await Disc.create({
      name: "Destroyer",
      brand: "Innova",
      type: "Distance Driver",
      userId: user._id,
    });

    // Initial order: disc1, disc2, disc3
    user.discShelf = [disc1._id, disc2._id, disc3._id];
    await user.save();

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    // Reorder to: disc2, disc3, disc1
    const newOrder = [
      disc2._id.toString(),
      disc3._id.toString(),
      disc1._id.toString(),
    ];

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: newOrder, zone: "shelf" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.discShelf.map((id: any) => id.toString())).toEqual(newOrder);
  });

  test("handles empty orderedIds array", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const disc1 = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    user.bag = [disc1._id];
    await user.save();

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: [], zone: "bag" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.bag).toHaveLength(0);
  });

  test("can reorder single disc (no-op but valid)", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const disc1 = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
      userId: user._id,
    });

    user.bag = [disc1._id];
    await user.save();

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/user/discs/reorder")
      .send({ orderedIds: [disc1._id.toString()], zone: "bag" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.bag).toHaveLength(1);
    expect(updatedUser?.bag[0].toString()).toBe(disc1._id.toString());
  });
});

