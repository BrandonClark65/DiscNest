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

describe("GET /api/user/discs/bag", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).get("/api/user/discs/bag");

    expect(res.status).toBe(401);
  });

  test("returns empty bag for new user", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/user/discs/bag");

    expect(res.status).toBe(200);
    expect(res.body.bag).toEqual([]);
  });

  test("returns user's bag discs", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    const disc1 = await Disc.create({
      name: "Buzzz",
      brand: "Discraft",
      type: "Midrange",
    });

    const disc2 = await Disc.create({
      name: "Teebird",
      brand: "Innova",
      type: "Fairway Driver",
    });

    user.bag = [disc1._id, disc2._id];
    await user.save();

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/user/discs/bag");

    expect(res.status).toBe(200);
    expect(res.body.bag).toHaveLength(2);
    expect(res.body.bag[0].name).toBe("Buzzz");
    expect(res.body.bag[1].name).toBe("Teebird");
  });
});

describe("GET /api/user/discs/shelf", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).get("/api/user/discs/shelf");

    expect(res.status).toBe(401);
  });

  test("returns empty shelf for new user", async () => {
    const user = await User.create({
      name: "User",
      email: "user@test.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app).get("/api/user/discs/shelf");

    expect(res.status).toBe(200);
    expect(res.body.shelf).toEqual([]);
  });
});

