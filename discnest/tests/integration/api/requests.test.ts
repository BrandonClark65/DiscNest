// tests/integration/api/requests.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import DiscRequest from "@/models/DiscRequest";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import { setupStandardMocks, mockRequireUser, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("GET /api/requests", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("returns empty array initially", async () => {
    const res = await request(app).get("/api/requests");

    expect(res.status).toBe(200);
    expect(res.body.requests).toEqual([]);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });
});

describe("POST /api/requests", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/requests")
      .send({
        title: "Looking for Destroyer",
        latitude: 40.7128,
        longitude: -74.0060,
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized: Unauthorized");
  });

  test("creates disc request with valid data", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const requestData = {
      title: "Looking for Destroyer",
      description: "Need a max weight Destroyer",
      brand: "Innova",
      plastic: "Champion",
      weight: 175,
      color: "Blue",
      condition: "New",
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const res = await request(app)
      .post("/api/requests")
      .send(requestData);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Looking for Destroyer");
    expect(res.body.userId).toBe(user._id.toString());
    expect(res.body.description).toBe("Need a max weight Destroyer");
    expect(res.body.brand).toBe("Innova");
    expect(res.body.plastic).toBe("Champion");
    expect(res.body.weight).toBe(175);
    expect(res.body.color).toBe("Blue");
    expect(res.body.condition).toBe("New");
    expect(res.body.location).toBeDefined();
    expect(res.body.location.type).toBe("Point");
    expect(res.body.location.coordinates).toEqual([-74.0060, 40.7128]); // [lng, lat]

    // Verify it was saved to database
    const savedRequest = await DiscRequest.findById(res.body._id);
    expect(savedRequest).toBeTruthy();
    expect(savedRequest?.userId.toString()).toBe(user._id.toString());
  });

  test("creates disc request with minimal required fields", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const requestData = {
      title: "Need a Buzzz",
      latitude: 34.0522,
      longitude: -118.2437,
    };

    const res = await request(app)
      .post("/api/requests")
      .send(requestData);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Need a Buzzz");
    expect(res.body.userId).toBe(user._id.toString());
    expect(res.body.location.coordinates).toEqual([-118.2437, 34.0522]);
  });

  test("returns 400 for missing title", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/requests")
      .send({
        latitude: 40.7128,
        longitude: -74.0060,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Title is required");
  });

  test("returns 400 for missing latitude", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/requests")
      .send({
        title: "Looking for Destroyer",
        longitude: -74.0060,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Location (latitude & longitude) is required");
  });

  test("returns 400 for missing longitude", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/requests")
      .send({
        title: "Looking for Destroyer",
        latitude: 40.7128,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Location (latitude & longitude) is required");
  });

  test("returns 400 for null latitude", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/requests")
      .send({
        title: "Looking for Destroyer",
        latitude: null,
        longitude: -74.0060,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Location (latitude & longitude) is required");
  });

  test("returns 400 for null longitude", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString() },
    });

    const res = await request(app)
      .post("/api/requests")
      .send({
        title: "Looking for Destroyer",
        latitude: 40.7128,
        longitude: null,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Location (latitude & longitude) is required");
  });
});

describe("GET /api/requests/[id]", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
  });
  afterAll(closeTestDb);

  test("returns single request by ID", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      shareableBagId: `bag-${Date.now()}-${Math.random()}`,
    });

    const discRequest = await DiscRequest.create({
      userId: user._id,
      title: "Looking for Destroyer",
      description: "Need a max weight Destroyer",
      brand: "Innova",
      location: {
        type: "Point",
        coordinates: [-74.0060, 40.7128],
      },
    });

    const res = await request(app).get(`/api/requests/${discRequest._id}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(discRequest._id.toString());
    expect(res.body.title).toBe("Looking for Destroyer");
    expect(res.body.description).toBe("Need a max weight Destroyer");
    expect(res.body.brand).toBe("Innova");
    expect(res.body.userId).toBeDefined();
    // Check populated user fields
    if (res.body.userId && typeof res.body.userId === "object") {
      expect(res.body.userId.name).toBe("Test User");
    }
  });

  test("returns 404 for non-existent request", async () => {
    // Use a valid ObjectId format but non-existent ID
    const fakeId = "507f1f77bcf86cd799439011";

    const res = await request(app).get(`/api/requests/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Request not found");
  });

  test("returns 500 for invalid ID format", async () => {
    // Mongoose throws CastError for invalid ObjectId format
    // This gets caught by error handling and returns 500
    const res = await request(app).get("/api/requests/invalid-id");

    expect(res.status).toBe(500);
  });
});
