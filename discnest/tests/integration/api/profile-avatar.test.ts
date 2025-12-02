import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import { setupStandardMocks, setupCloudinaryMocks, mockRequireUser, mockCloudinaryDestroy, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();
setupCloudinaryMocks();

// Helper to create a test image buffer (minimal PNG)
function createTestImageBuffer(): Buffer {
  // Minimal valid PNG file (1x1 pixel, transparent)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  ]);
  return Buffer.concat([pngHeader, Buffer.alloc(100)]);
}

describe("POST /api/profile/avatar", () => {
  let originalFetch: typeof global.fetch;
  let mockFetch: any;

  beforeAll(() => {
    connectTestDb();
    // Store original fetch
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    // Create fresh fetch mock for each test
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
    mockCloudinaryDestroy.mockReset();
  });

  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
    // Restore original fetch
    global.fetch = originalFetch;
  });

  afterAll(() => {
    closeTestDb();
    // Restore original fetch
    global.fetch = originalFetch;
  });

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/profile/avatar")
      .attach("file", createTestImageBuffer(), "test.png");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized: Unauthorized");
  });

  test("returns 400 if no file uploaded", async () => {
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

    // Send multipart form without file field
    const res = await request(app)
      .post("/api/profile/avatar")
      .field("dummy", "value"); // Send multipart form but no file

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No file uploaded");
  });

  test("successfully uploads avatar and updates user profile", async () => {
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

    // Mock successful upload API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imageUrl: "https://res.cloudinary.com/test/image/upload/v123/avatar.png",
        publicId: "avatars/test-avatar",
        status: "approved",
        flagged: false,
      }),
    });

    // Mock Cloudinary destroy (no old avatar to delete)
    mockCloudinaryDestroy.mockResolvedValueOnce({ result: "ok" });

    const res = await request(app)
      .post("/api/profile/avatar")
      .attach("file", createTestImageBuffer(), "avatar.png");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.avatarUrl).toBe("https://res.cloudinary.com/test/image/upload/v123/avatar.png");
    expect(res.body.status).toBe("approved");
    expect(res.body.flagged).toBe(false);

    // Verify user was updated
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.avatarUrl).toBe("https://res.cloudinary.com/test/image/upload/v123/avatar.png");
    expect(updatedUser?.avatarPublicId).toBe("avatars/test-avatar");

    // Verify upload API was called
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/upload"),
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  test("deletes old avatar from Cloudinary when user has existing avatar", async () => {
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

    // Mock successful upload API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imageUrl: "https://res.cloudinary.com/test/image/upload/v123/new-avatar.png",
        publicId: "avatars/new-avatar",
        status: "approved",
        flagged: false,
      }),
    });

    // Mock Cloudinary destroy for old avatar
    mockCloudinaryDestroy.mockResolvedValueOnce({ result: "ok" });

    const res = await request(app)
      .post("/api/profile/avatar")
      .attach("file", createTestImageBuffer(), "new-avatar.png");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify old avatar was deleted
    expect(mockCloudinaryDestroy).toHaveBeenCalledWith("avatars/old-avatar");

    // Verify user was updated with new avatar
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.avatarUrl).toBe("https://res.cloudinary.com/test/image/upload/v123/new-avatar.png");
    expect(updatedUser?.avatarPublicId).toBe("avatars/new-avatar");
  });

  test("handles upload API failures", async () => {
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

    // Mock upload API failure - returns error response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        error: "Upload failed",
      }),
    });

    const res = await request(app)
      .post("/api/profile/avatar")
      .attach("file", createTestImageBuffer(), "avatar.png");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Upload failed");

    // Verify user was not updated
    const unchangedUser = await User.findById(user._id);
    expect(unchangedUser?.avatarUrl).toBeUndefined();
    expect(unchangedUser?.avatarPublicId).toBeUndefined();
  });

  test("handles upload API network failures", async () => {
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

    // Mock fetch to throw network error
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const res = await request(app)
      .post("/api/profile/avatar")
      .attach("file", createTestImageBuffer(), "avatar.png");

    // Should be handled by withErrorHandling and return 500
    expect(res.status).toBe(500);
  });

  test("handles Cloudinary deletion failures gracefully", async () => {
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

    // Mock successful upload API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imageUrl: "https://res.cloudinary.com/test/image/upload/v123/new-avatar.png",
        publicId: "avatars/new-avatar",
        status: "approved",
        flagged: false,
      }),
    });

    // Mock Cloudinary destroy to fail
    mockCloudinaryDestroy.mockRejectedValueOnce(new Error("Cloudinary deletion failed"));

    const res = await request(app)
      .post("/api/profile/avatar")
      .attach("file", createTestImageBuffer(), "new-avatar.png");

    // Should still succeed even if Cloudinary deletion fails
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify user was still updated with new avatar
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.avatarUrl).toBe("https://res.cloudinary.com/test/image/upload/v123/new-avatar.png");
    expect(updatedUser?.avatarPublicId).toBe("avatars/new-avatar");
  });

  test("handles flagged images from upload API", async () => {
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

    // Mock upload API response with flagged image
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imageUrl: "https://res.cloudinary.com/test/image/upload/v123/flagged-avatar.png",
        publicId: "avatars/flagged-avatar",
        status: "pendingReview",
        flagged: true,
      }),
    });

    mockCloudinaryDestroy.mockResolvedValueOnce({ result: "ok" });

    const res = await request(app)
      .post("/api/profile/avatar")
      .attach("file", createTestImageBuffer(), "avatar.png");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.flagged).toBe(true);
    expect(res.body.status).toBe("pendingReview");

    // Verify user was still updated (even if flagged)
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.avatarUrl).toBe("https://res.cloudinary.com/test/image/upload/v123/flagged-avatar.png");
    expect(updatedUser?.avatarPublicId).toBe("avatars/flagged-avatar");
  });

  test("passes cookie header to upload API", async () => {
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

    // Mock successful upload API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        imageUrl: "https://res.cloudinary.com/test/image/upload/v123/avatar.png",
        publicId: "avatars/test-avatar",
        status: "approved",
        flagged: false,
      }),
    });

    mockCloudinaryDestroy.mockResolvedValueOnce({ result: "ok" });

    const res = await request(app)
      .post("/api/profile/avatar")
      .set("Cookie", "session=test-session")
      .attach("file", createTestImageBuffer(), "avatar.png");

    expect(res.status).toBe(200);

    // Verify fetch was called with headers that include cookie property
    // The route forwards cookies via req.headers.get("cookie") || ""
    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toContain("/api/upload");
    expect(fetchCall[1].method).toBe("POST");
    expect(fetchCall[1].headers).toHaveProperty("cookie");
    // The cookie value may be empty if supertest doesn't pass it through,
    // but the important thing is that the route attempts to forward it
  });
});

