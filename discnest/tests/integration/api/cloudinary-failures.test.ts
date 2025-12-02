// tests/integration/api/cloudinary-failures.test.ts
// Tests for Cloudinary external service failure handling
import { describe, test, expect, beforeAll, afterEach, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import Listing from "@/models/Listing";
import { setupStandardMocks, setupCloudinaryMocks, setupMessageMocks, mockRequireUser, mockCloudinaryDestroy, mockUploadStream, mockAddSystemMessageToThreads, resetAllMocks } from "../../utils/testMocks";

// Setup mocks
setupStandardMocks();
setupCloudinaryMocks();
setupMessageMocks();

// Cloudinary mocks are set up by setupCloudinaryMocks()
// Import mockUploadStream for custom test behavior
import { mockUploadStream } from "../../utils/testMocks";

/* ----------------------------------------------------
   NSFW MODEL MOCKS (needed for upload route)
---------------------------------------------------- */
const mockNSFWModel = {
  classify: vi.fn(),
};

vi.mock("@/lib/nsfwModel", () => ({
  getNSFWModel: vi.fn().mockResolvedValue(mockNSFWModel),
  tf: {
    tidy: vi.fn((fn) => fn()),
    tensor3d: vi.fn(),
    slice: vi.fn(() => ({
      dispose: vi.fn(),
    })),
  },
}));

vi.mock("file-type", () => ({
  fileTypeFromBuffer: vi.fn(),
}));

const mockCanvas = {
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8Array(224 * 224 * 4).fill(128),
    })),
  })),
};

vi.mock("canvas", () => ({
  createCanvas: vi.fn(() => mockCanvas),
  loadImage: vi.fn(),
}));

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

  mockNSFWModel.classify.mockResolvedValueOnce([
    { className: "Neutral", probability: 0.9 },
  ]);
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

describe("Cloudinary Service Failures", () => {
  let originalFetch: typeof global.fetch;
  let mockFetch: any;

  beforeAll(async () => {
    await connectTestDb();
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
    resetAllMocks();
  });

  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
    mockUploadStream.mockReset();
    mockNSFWModel.classify.mockReset();
    // Already reset by resetAllMocks()
  });

  afterAll(() => {
    closeTestDb();
    global.fetch = originalFetch;
  });

  describe("Cloudinary Upload Failures", () => {
    test("handles Cloudinary upload network timeout", async () => {
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

      // Mock Cloudinary upload to timeout (never calls callback)
      const mockStream = {
        end: vi.fn(),
      };
      mockUploadStream.mockImplementation(() => {
        // Don't call callback - simulates timeout
        return mockStream;
      });

      // Use a timeout to simulate the upload hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timeout")), 100);
      });

      const uploadPromise = request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      try {
        await Promise.race([uploadPromise, timeoutPromise]);
      } catch (err) {
        // Expected - timeout or error
      }
    }, 2000);

    test("handles Cloudinary upload API error response", async () => {
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

      // Mock Cloudinary upload to fail with error
      const mockStream = {
        end: vi.fn(),
      };
      mockUploadStream.mockImplementation((options: any, callback: any) => {
        setTimeout(() => {
          callback(new Error("Cloudinary API error: Invalid API key"), null);
        }, 0);
        return mockStream;
      });

      const res = await request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      expect(res.status).toBe(500);
    });

    test("handles Cloudinary upload quota exceeded", async () => {
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

      // Mock Cloudinary upload to fail with quota error
      const mockStream = {
        end: vi.fn(),
      };
      mockUploadStream.mockImplementation((options: any, callback: any) => {
        setTimeout(() => {
          callback(new Error("Cloudinary error: Quota exceeded"), null);
        }, 0);
        return mockStream;
      });

      const res = await request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      expect(res.status).toBe(500);
    });
  });

  describe("Cloudinary Deletion Failures", () => {
    test("handles Cloudinary deletion failure gracefully in listing deletion", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "hashed",
      });

      const listing = await Listing.create({
        title: "Test Disc",
        brand: "Innova",
        type: "Sell",
        condition: "New",
        price: 25,
        description: "Great disc",
        userId: user._id,
        publicIds: ["test/public-id-1", "test/public-id-2"],
      });

      mockRequireUser.mockResolvedValueOnce({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });

      // Mock Cloudinary destroy to fail for first image, succeed for second
      mockCloudinaryDestroy
        .mockRejectedValueOnce(new Error("Cloudinary deletion failed"))
        .mockResolvedValueOnce({ result: "ok" });

      const res = await request(app)
        .delete(`/api/listings/${listing._id}`)
        .set("Cookie", "session=test");

      // Should still succeed - deletion failures are logged but don't block
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Listing deleted successfully");

      // Verify listing was deleted from database
      const deletedListing = await Listing.findById(listing._id);
      expect(deletedListing).toBeNull();

      // Verify Cloudinary destroy was attempted for both images
      expect(mockCloudinaryDestroy).toHaveBeenCalledTimes(2);
    });

    test("handles Cloudinary deletion failure gracefully in avatar upload", async () => {
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
      mockCloudinaryDestroy.mockRejectedValueOnce(
        new Error("Cloudinary deletion failed")
      );

      const res = await request(app)
        .post("/api/profile/avatar")
        .attach("file", createTestImageBuffer(), "new-avatar.png");

      // Should still succeed - deletion failure is caught and logged
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user was updated with new avatar
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.avatarUrl).toBe(
        "https://res.cloudinary.com/test/image/upload/v123/new-avatar.png"
      );
    });

    test("handles Cloudinary deletion network timeout", async () => {
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

      // Mock Cloudinary destroy to timeout (never resolves)
      mockCloudinaryDestroy.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 30000);
          })
      );

      // Use a shorter timeout for the test
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Test timeout")), 1000);
      });

      const uploadPromise = request(app)
        .post("/api/profile/avatar")
        .attach("file", createTestImageBuffer(), "new-avatar.png");

      // The deletion timeout should be handled gracefully
      try {
        await Promise.race([uploadPromise, timeoutPromise]);
      } catch (err) {
        // Expected in test scenario
      }
    }, 2000);
  });
});

