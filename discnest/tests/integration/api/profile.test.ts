import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import { setupStandardMocks, mockRequireUser, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();

describe("GET /api/profile", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).get("/api/profile");

    expect(res.status).toBe(401);
  });

  test("returns user profile", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      username: "testuser",
      bio: "Test bio",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: { 
        id: user._id.toString(),
        email: user.email,
      },
    });

    const res = await request(app).get("/api/profile");

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user._id).toBe(user._id.toString());
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.name).toBe("Test User");
    expect(res.body.user.username).toBe("testuser");
    expect(res.body.user.bio).toBe("Test bio");
  });

  test("returns 404 if user not found", async () => {
    mockRequireUser.mockResolvedValueOnce({
      user: {
        id: "507f1f77bcf86cd799439011",
        email: "nonexistent@example.com",
      },
    });

    const res = await request(app).get("/api/profile");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });
});

describe("POST /api/profile", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/profile")
      .send({ name: "New Name" });

    expect(res.status).toBe(401);
  });

  test("updates profile with all field types", async () => {
    const user = await User.create({
      name: "Original Name",
      email: "test@example.com",
      password: "hashed",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });

    const comprehensiveUpdate = {
      name: "John Doe",
      username: "johndoe",
      bio: "Disc golf enthusiast",
      pdgaNumber: 12345,
      homeCourse: "Oak Grove",
      favoriteCourses: ["DeLaveaga", "Milo McIver"],
      maxDistanceFt: 400,
      goals: "Improve putting",
      dominantHand: "Right" as const,
      throwStyle: "Backhand" as const,
      favoriteBrands: ["Innova", "Discraft"],
      preferredDiscTypes: ["Fairway Driver", "Midrange"],
      stabilityPreference: "Straight" as const,
      armSpeed: "Medium" as const,
      skillLevel: "Advanced" as const,
      playFrequency: "1-2 times per week" as const,
      preferredPlastics: ["Champion", "DX"],
      location: {
        type: "Point" as const,
        coordinates: [-122.4194, 37.7749],
      },
    };

    const res = await request(app)
      .post("/api/profile")
      .send(comprehensiveUpdate);

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("John Doe");
    expect(res.body.user.username).toBe("johndoe");
    expect(res.body.user.bio).toBe("Disc golf enthusiast");
    expect(res.body.user.pdgaNumber).toBe(12345);
    expect(res.body.user.maxDistanceFt).toBe(400);
    expect(res.body.user.dominantHand).toBe("Right");
    expect(res.body.user.favoriteBrands).toEqual(["Innova", "Discraft"]);
    expect(res.body.user.location.coordinates).toEqual([-122.4194, 37.7749]);

    // Verify database was updated
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.name).toBe("John Doe");
    expect(updatedUser?.username).toBe("johndoe");
  });

  test("handles partial updates", async () => {
    const user = await User.create({
      name: "Original Name",
      email: "test@example.com",
      password: "hashed",
      username: "originaluser",
      bio: "Original bio",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });

    // Only update name, keep other fields unchanged
    const res = await request(app)
      .post("/api/profile")
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Updated Name");
    expect(res.body.user.username).toBe("originaluser");
    expect(res.body.user.bio).toBe("Original bio");
  });

  test("validates input and returns errors for invalid data", async () => {
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

    // Test a few representative validation errors
    const invalidRequests = [
      { username: "ab" }, // Too short
      { username: "a".repeat(21) }, // Too long
      { bio: "a".repeat(301) }, // Too long
      { avatarUrl: "not-a-valid-url" }, // Invalid URL
      { maxDistanceFt: -1 }, // Below minimum
      { maxDistanceFt: 801 }, // Above maximum
      { dominantHand: "Invalid" }, // Invalid enum
      { favoriteBrands: ["InvalidBrand"] }, // Invalid array value
    ];

    for (const invalidData of invalidRequests) {
      const res = await request(app)
        .post("/api/profile")
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid data");
      expect(res.body.details).toBeDefined();
    }
  });

  test("handles empty request body", async () => {
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

    const res = await request(app)
      .post("/api/profile")
      .send({});

    // Empty body should be valid (all fields optional)
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });
});

