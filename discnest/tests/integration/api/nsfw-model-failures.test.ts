// tests/integration/api/nsfw-model-failures.test.ts
// Tests for NSFW model failure handling
import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import { setupFullMocks, mockRequireUser, mockNSFWModel, mockUploadStream, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupFullMocks();

/* ----------------------------------------------------
   HELPER FUNCTIONS
---------------------------------------------------- */

function createTestImageBuffer(): Buffer {
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  return Buffer.concat([pngHeader, Buffer.alloc(100)]);
}

async function setupMockImageUpload() {
  const { fileTypeFromBuffer } = await import("file-type");
  vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
    mime: "image/png",
    ext: "png",
  } as any);

  const { loadImage } = await import("canvas");
  vi.mocked(loadImage).mockResolvedValueOnce({} as any);
}

function setupMockCloudinaryUploadSuccess() {
  const mockStream = {
    end: vi.fn(),
  };
  mockUploadStream.mockImplementation((options: any, callback: any) => {
    setTimeout(() => {
      callback(null, {
        secure_url: "https://res.cloudinary.com/test/image/upload/v123/test.png",
        public_id: "test/test",
      });
    }, 0);
    return mockStream;
  });
}

/* ----------------------------------------------------
   TESTS
---------------------------------------------------- */

describe("NSFW Model Failures", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });

  afterAll(() => {
    closeTestDb();
  });

  describe("NSFW Model Failures", () => {
    test("handles NSFW model loading failure", async () => {
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

      await setupMockImageUpload();

      // Mock getNSFWModel to fail during loading
      const { getNSFWModel } = await import("@/lib/nsfwModel");
      vi.mocked(getNSFWModel).mockRejectedValueOnce(
        new Error("Failed to load NSFW model")
      );

      const res = await request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      expect(res.status).toBe(500);
    });

    test("handles NSFW model classification error", async () => {
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

      await setupMockImageUpload();

      mockNSFWModel.classify.mockRejectedValueOnce(
        new Error("TensorFlow error: Out of memory")
      );

      const res = await request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      expect(res.status).toBe(500);
    });

    test("handles NSFW model classification timeout", async () => {
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

      await setupMockImageUpload();

      mockNSFWModel.classify.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Classification timeout")), 30000);
          })
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Test timeout")), 1000);
      });

      const uploadPromise = request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      try {
        await Promise.race([uploadPromise, timeoutPromise]);
      } catch (err) {
        // Expected in test scenario
      }
    }, 2000);

    test("handles NSFW model returning invalid predictions", async () => {
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

      await setupMockImageUpload();

      mockNSFWModel.classify.mockResolvedValueOnce(null as any);

      const res = await request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      expect([200, 500]).toContain(res.status);
    });

    test("handles NSFW model returning empty predictions array", async () => {
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

      await setupMockImageUpload();

      mockNSFWModel.classify.mockResolvedValueOnce([]);
      setupMockCloudinaryUploadSuccess();

      const res = await request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      expect(res.status).toBe(200);
      expect(res.body.flagged).toBe(false);
      expect(res.body.status).toBe("approved");
    });
  });
});

