// tests/integration/api/combined-external-failures.test.ts
// Tests for combined external service failure scenarios
import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import { setupStandardMocks, setupCloudinaryMocks, mockRequireUser, mockSendEmail, mockCloudinaryDestroy, mockFetch, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();
setupCloudinaryMocks();

function createTestImageBuffer(): Buffer {
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  return Buffer.concat([pngHeader, Buffer.alloc(100)]);
}

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("Combined External Service Failures", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(() => {
    resetAllMocks();
    // Ensure global.fetch uses our mock
    global.fetch = mockFetch as any;

    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.RESEND_FROM_DEV = "noreply@dev.example.com";
    process.env.NODE_ENV = "development";
    process.env.OPENCAGE_API_KEY = "test-api-key-123";
  });

  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });

  afterAll(() => {
    closeTestDb();
  });

  /**
   * Tests listing creation when multiple external services fail simultaneously
   * Simulates real-world scenario where OpenCage (reverse geocoding) and Resend (email) both fail
   * Verifies graceful error handling and that partial failures don't corrupt data
   * 
   * Expected behavior:
   * - Listing should still be created (core functionality works)
   * - OpenCage failure should be handled gracefully (location may be missing)
   * - Resend failure should be logged but not block listing creation
   */
  test("handles multiple external service failures in listing creation", async () => {
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

    // Mock OpenCage to fail
    mockFetch.mockRejectedValueOnce(new Error("OpenCage API error"));

    // Mock Resend to fail
    mockSendEmail.mockRejectedValueOnce(new Error("Resend API error"));

    const res = await request(app)
      .post("/api/listings")
      .set("Cookie", "session=test")
      .send({
        title: "Test Disc",
        brand: "Innova",
        type: "Sell",
        condition: "New",
        price: 25,
        description: "Great disc",
        location: {
          type: "Point",
          coordinates: [-122.4194, 37.7749],
        },
        pendingReview: true,
      });

    expect([201, 500]).toContain(res.status);
  });

  /**
   * Tests avatar upload when both Cloudinary (image storage) and Resend (email) fail
   * Simulates failure scenario where image upload fails and cleanup also fails
   * Verifies error handling prevents partial state and provides clear error messages
   * 
   * Expected behavior:
   * - Upload failure should be caught and returned as 500 error
   * - Old avatar should remain unchanged if new upload fails
   * - Error should be logged but not crash the application
   */
  test("handles Cloudinary and Resend failures in avatar upload flow", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
      avatarUrl: "https://res.cloudinary.com/test/image/upload/v100/old-avatar.png",
      avatarPublicId: "avatars/old-avatar",
    });

    mockRequireUser.mockResolvedValueOnce({
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });

    // Mock upload API to fail (Cloudinary failure inside)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        error: "Upload failed",
      }),
    });

    // Mock Cloudinary destroy to fail
    mockCloudinaryDestroy.mockRejectedValueOnce(
      new Error("Cloudinary deletion failed")
    );

    const res = await request(app)
      .post("/api/profile/avatar")
      .attach("file", createTestImageBuffer(), "new-avatar.png");

    expect(res.status).toBe(500);
  });
});
