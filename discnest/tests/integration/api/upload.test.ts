import { describe, test, expect, beforeAll, afterEach, afterAll, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import User from "@/models/User";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";

// Mock database connection
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: async () => {},
}));

// Mock error logger
vi.mock("@/lib/errorLogger", () => ({
  logError: vi.fn(),
}));

// Mock withErrorHandling
vi.mock("@/lib/withErrorHandling", () => ({
  withErrorHandling: (handler: any) => handler,
}));

// Mock requireUser for authenticated routes
const mockRequireUser = vi.fn();
vi.mock("@/lib/auth/requireUser", () => ({
  requireUser: () => mockRequireUser(),
}));

// Mock withUserAuth
vi.mock("@/lib/auth/withUserAuth", () => ({
  withUserAuth: (handler: any) => async (req: Request, context?: any) => {
    try {
      const session = await mockRequireUser();
      return handler(req, session, context);
    } catch (err: any) {
      const { NextResponse } = await import("next/server");
      const status = err.name === "UnauthorizedError" ? 401 : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
  },
}));

// Mock Cloudinary
const mockUploadStream = vi.fn();
const mockCloudinaryUploader = {
  upload_stream: mockUploadStream,
  destroy: vi.fn().mockResolvedValue({ result: "ok" }),
};

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: mockCloudinaryUploader,
  },
}));

// Mock NSFW model
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

// Mock file-type
vi.mock("file-type", () => ({
  fileTypeFromBuffer: vi.fn(),
}));

// Mock canvas
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

// Helper to create a test image buffer (minimal PNG)
function createTestImageBuffer(): Buffer {
  // Minimal valid PNG file (1x1 pixel, transparent)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  ]);
  // This is a simplified version - in real tests you might use a library
  // For now, we'll mock file-type to return image/png
  return Buffer.concat([pngHeader, Buffer.alloc(100)]);
}

describe("POST /api/upload", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    mockRequireUser.mockReset();
    mockUploadStream.mockReset();
    mockNSFWModel.classify.mockReset();
    vi.mocked(await import("file-type")).fileTypeFromBuffer.mockReset();
    vi.mocked(await import("canvas")).loadImage.mockReset();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app)
      .post("/api/upload")
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

    const res = await request(app).post("/api/upload");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No file uploaded");
  });

  test("returns 400 if file is not an image", async () => {
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

    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "application/pdf",
      ext: "pdf",
    } as any);

    const res = await request(app)
      .post("/api/upload")
      .attach("file", Buffer.from("not an image"), "test.pdf");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Not an image");
  });

  test("successfully uploads image and returns approved status", async () => {
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

    // Mock file-type to return image/png
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    } as any);

    // Mock canvas loadImage
    const { loadImage } = await import("canvas");
    vi.mocked(loadImage).mockResolvedValueOnce({} as any);

    // Mock NSFW model to return safe predictions
    mockNSFWModel.classify.mockResolvedValueOnce([
      { className: "Neutral", probability: 0.9 },
      { className: "Drawing", probability: 0.1 },
    ]);

    // Mock Cloudinary upload stream
    const mockStream = {
      end: vi.fn(),
    };
    mockUploadStream.mockImplementation((options: any, callback: any) => {
      // Simulate successful upload
      setTimeout(() => {
        callback(null, {
          secure_url: "https://res.cloudinary.com/test/image/upload/v123/test.png",
          public_id: "test/test",
        });
      }, 0);
      return mockStream;
    });

    const res = await request(app)
      .post("/api/upload")
      .attach("file", createTestImageBuffer(), "test.png");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
    expect(res.body.imageUrl).toBe("https://res.cloudinary.com/test/image/upload/v123/test.png");
    expect(res.body.publicId).toBe("test/test");
    expect(res.body.flagged).toBe(false);
    expect(mockUploadStream).toHaveBeenCalledWith(
      { folder: "misc" },
      expect.any(Function)
    );
  });

  test("returns pendingReview status when image is flagged", async () => {
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

    // Mock file-type to return image/png
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    } as any);

    // Mock canvas loadImage
    const { loadImage } = await import("canvas");
    vi.mocked(loadImage).mockResolvedValueOnce({} as any);

    // Mock NSFW model to return flagged predictions
    mockNSFWModel.classify.mockResolvedValueOnce([
      { className: "Porn", probability: 0.8 },
      { className: "Neutral", probability: 0.2 },
    ]);

    // Mock Cloudinary upload stream
    const mockStream = {
      end: vi.fn(),
    };
    mockUploadStream.mockImplementation((options: any, callback: any) => {
      setTimeout(() => {
        callback(null, {
          secure_url: "https://res.cloudinary.com/test/image/upload/v123/flagged.png",
          public_id: "test/flagged",
        });
      }, 0);
      return mockStream;
    });

    const res = await request(app)
      .post("/api/upload")
      .attach("file", createTestImageBuffer(), "test.png");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pendingReview");
    expect(res.body.flagged).toBe(true);
    expect(res.body.imageUrl).toBeDefined();
    expect(res.body.publicId).toBeDefined();
  });

  test("uses custom folder parameter when provided", async () => {
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

    // Mock file-type to return image/png
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    } as any);

    // Mock canvas loadImage
    const { loadImage } = await import("canvas");
    vi.mocked(loadImage).mockResolvedValueOnce({} as any);

    // Mock NSFW model
    mockNSFWModel.classify.mockResolvedValueOnce([
      { className: "Neutral", probability: 0.9 },
    ]);

    // Mock Cloudinary upload stream
    const mockStream = {
      end: vi.fn(),
    };
    mockUploadStream.mockImplementation((options: any, callback: any) => {
      setTimeout(() => {
        callback(null, {
          secure_url: "https://res.cloudinary.com/test/image/upload/v123/test.png",
          public_id: "disc-listings/test",
        });
      }, 0);
      return mockStream;
    });

    const res = await request(app)
      .post("/api/upload")
      .field("folder", "disc-listings")
      .attach("file", createTestImageBuffer(), "test.png");

    expect(res.status).toBe(200);
    expect(mockUploadStream).toHaveBeenCalledWith(
      { folder: "disc-listings" },
      expect.any(Function)
    );
  });

  test("defaults to misc folder when folder not provided", async () => {
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

    // Mock file-type to return image/png
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    } as any);

    // Mock canvas loadImage
    const { loadImage } = await import("canvas");
    vi.mocked(loadImage).mockResolvedValueOnce({} as any);

    // Mock NSFW model
    mockNSFWModel.classify.mockResolvedValueOnce([
      { className: "Neutral", probability: 0.9 },
    ]);

    // Mock Cloudinary upload stream
    const mockStream = {
      end: vi.fn(),
    };
    mockUploadStream.mockImplementation((options: any, callback: any) => {
      setTimeout(() => {
        callback(null, {
          secure_url: "https://res.cloudinary.com/test/image/upload/v123/test.png",
          public_id: "misc/test",
        });
      }, 0);
      return mockStream;
    });

    const res = await request(app)
      .post("/api/upload")
      .attach("file", createTestImageBuffer(), "test.png");

    expect(res.status).toBe(200);
    expect(mockUploadStream).toHaveBeenCalledWith(
      { folder: "misc" },
      expect.any(Function)
    );
  });

  test("handles Cloudinary upload failures", async () => {
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

    // Mock file-type to return image/png
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    } as any);

    // Mock canvas loadImage
    const { loadImage } = await import("canvas");
    vi.mocked(loadImage).mockResolvedValueOnce({} as any);

    // Mock NSFW model
    mockNSFWModel.classify.mockResolvedValueOnce([
      { className: "Neutral", probability: 0.9 },
    ]);

    // Mock Cloudinary upload stream to fail
    const mockStream = {
      end: vi.fn(),
    };
    mockUploadStream.mockImplementation((options: any, callback: any) => {
      setTimeout(() => {
        callback(new Error("Cloudinary upload failed"), null);
      }, 0);
      return mockStream;
    });

    const res = await request(app)
      .post("/api/upload")
      .attach("file", createTestImageBuffer(), "test.png");

    // Should be handled by withErrorHandling and return 500
    expect(res.status).toBe(500);
  });

  test("handles NSFW model classification errors gracefully", async () => {
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

    // Mock file-type to return image/png
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    } as any);

    // Mock canvas loadImage
    const { loadImage } = await import("canvas");
    vi.mocked(loadImage).mockResolvedValueOnce({} as any);

    // Mock NSFW model to throw error
    mockNSFWModel.classify.mockRejectedValueOnce(new Error("Model error"));

    // Should be handled by withErrorHandling
    const res = await request(app)
      .post("/api/upload")
      .attach("file", createTestImageBuffer(), "test.png");

    expect(res.status).toBe(500);
  });

  test("handles canvas loadImage errors gracefully", async () => {
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

    // Mock file-type to return image/png
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    } as any);

    // Mock canvas loadImage to throw error
    const { loadImage } = await import("canvas");
    vi.mocked(loadImage).mockRejectedValueOnce(new Error("Invalid image"));

    // Should be handled by withErrorHandling
    const res = await request(app)
      .post("/api/upload")
      .attach("file", createTestImageBuffer(), "test.png");

    expect(res.status).toBe(500);
  });

  test("flags images with various NSFW classes above threshold", async () => {
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

    const flaggedClasses = [
      "Porn",
      "Hentai",
      "Erotica",
      "Sexual activity",
      "Nude",
      "Sexy",
      "Lewd",
      "Suggestive",
      "Adult content",
      "Graphic violence",
      "Gore",
      "Self-harm",
      "Drug use",
    ];

    // Test each flagged class
    for (const className of flaggedClasses) {
      // Mock file-type
      const { fileTypeFromBuffer } = await import("file-type");
      vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
        mime: "image/png",
        ext: "png",
      } as any);

      // Mock canvas
      const { loadImage } = await import("canvas");
      vi.mocked(loadImage).mockResolvedValueOnce({} as any);

      // Mock NSFW model with flagged class above 0.6 threshold
      mockNSFWModel.classify.mockResolvedValueOnce([
        { className, probability: 0.7 },
        { className: "Neutral", probability: 0.3 },
      ]);

      // Mock Cloudinary
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

      const res = await request(app)
        .post("/api/upload")
        .attach("file", createTestImageBuffer(), "test.png");

      expect(res.status).toBe(200);
      expect(res.body.flagged).toBe(true);
      expect(res.body.status).toBe("pendingReview");

      // Reset mocks for next iteration
      mockUploadStream.mockReset();
      mockNSFWModel.classify.mockReset();
    }
  });

  test("does not flag images when probability is below threshold", async () => {
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

    // Mock file-type
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    } as any);

    // Mock canvas
    const { loadImage } = await import("canvas");
    vi.mocked(loadImage).mockResolvedValueOnce({} as any);

    // Mock NSFW model with flagged class but below 0.6 threshold
    mockNSFWModel.classify.mockResolvedValueOnce([
      { className: "Sexy", probability: 0.5 }, // Below 0.6 threshold
      { className: "Neutral", probability: 0.5 },
    ]);

    // Mock Cloudinary
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

    const res = await request(app)
      .post("/api/upload")
      .attach("file", createTestImageBuffer(), "test.png");

    expect(res.status).toBe(200);
    expect(res.body.flagged).toBe(false);
    expect(res.body.status).toBe("approved");
  });
});


