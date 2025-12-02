/**
 * Test Utilities: Common Mocks and Helpers
 * 
 * This file provides reusable mocks and helper functions for API integration tests.
 * Import the setup functions you need at the top of your test files.
 * 
 * @example
 * ```ts
 * import { setupCommonMocks, setupAuthMocks, mockRequireUser } from "../utils/testMocks";
 * 
 * setupCommonMocks();
 * setupAuthMocks();
 * 
 * describe("My API Route", () => {
 *   test("requires auth", async () => {
 *     mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));
 *     // ... test code
 *   });
 * });
 * ```
 */

import { vi } from "vitest";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";
import User from "@/models/User";

type UserType = InstanceType<typeof User>;

/* ============================================================
   AUTHENTICATION MOCKS
   ============================================================ */

/**
 * Mock function for requireUser authentication
 * Use this to control authentication in tests
 */
export const mockRequireUser = vi.fn();

/**
 * Mock function for getServerSession (used by messages route)
 */
export const mockGetServerSession = vi.fn();

/**
 * Sets up authentication mocks (requireUser, withUserAuth, getServerSession)
 * Call this once at the top of your test file
 */
export function setupAuthMocks() {
  vi.mock("@/lib/auth/requireUser", () => ({
    requireUser: () => mockRequireUser(),
  }));

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

  vi.mock("next-auth", () => ({
    getServerSession: () => mockGetServerSession(),
  }));

  vi.mock("@/lib/auth", () => ({
    authOptions: {},
  }));
}

/**
 * Helper to create a mock authenticated session for a user
 * @param user - User document or user ID
 * @returns Mock session object
 */
export function createMockSession(user: UserType | string) {
  const userId = typeof user === "string" ? user : user._id.toString();
  const email = typeof user === "string" ? "test@example.com" : user.email;
  
  return {
    user: {
      id: userId,
      email: email,
    },
  };
}

/**
 * Helper to mock authentication success for a user
 * @param user - User document or user ID
 */
export function mockAuthSuccess(user: UserType | string) {
  mockRequireUser.mockResolvedValueOnce(createMockSession(user));
}

/**
 * Helper to mock authentication failure
 */
export function mockAuthFailure() {
  mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));
}

/* ============================================================
   COMMON MOCKS (Database, Error Logger, etc.)
   ============================================================ */

/**
 * Sets up common mocks used by all API routes:
 * - MongoDB connection
 * - Error logger
 * - withErrorHandling
 * Call this once at the top of your test file
 */
export function setupCommonMocks() {
  vi.mock("@/lib/mongodb", () => ({
    connectToDatabase: async () => {},
  }));

  vi.mock("@/lib/errorLogger", () => ({
    logError: vi.fn(),
  }));

  vi.mock("@/lib/withErrorHandling", () => ({
    withErrorHandling: (handler: any) => handler,
  }));
}

/* ============================================================
   RESEND (EMAIL) MOCKS
   ============================================================ */

/**
 * Mock function for Resend email sending
 */
export const mockSendEmail = vi.fn().mockResolvedValue({ id: "email-123" });

/**
 * Sets up Resend email mocks
 */
export function setupResendMocks() {
  vi.mock("resend", () => ({
    Resend: class {
      emails = {
        send: mockSendEmail,
      };
    },
  }));

  // Also mock @/lib/resend which exports a resend instance
  vi.mock("@/lib/resend", () => ({
    resend: {
      emails: {
        send: mockSendEmail,
      },
    },
  }));
}

/* ============================================================
   CLOUDINARY MOCKS
   ============================================================ */

/**
 * Mock function for Cloudinary upload_stream
 */
export const mockUploadStream = vi.fn();

/**
 * Mock function for Cloudinary destroy (delete)
 */
export const mockCloudinaryDestroy = vi.fn().mockResolvedValue({ result: "ok" });

/**
 * Mock Cloudinary uploader object
 */
export const mockCloudinaryUploader = {
  upload_stream: mockUploadStream,
  destroy: mockCloudinaryDestroy,
};

/**
 * Sets up Cloudinary mocks
 */
export function setupCloudinaryMocks() {
  vi.mock("cloudinary", () => ({
    default: {
      v2: {
        config: vi.fn(),
        uploader: mockCloudinaryUploader,
      },
    },
    v2: {
      config: vi.fn(),
      uploader: mockCloudinaryUploader,
    },
  }));
}

/* ============================================================
   OPENCAGE (REVERSE GEOCODING) MOCKS
   ============================================================ */

/**
 * Mock function for global fetch (used by reverse geocoding)
 */
export const mockFetch = vi.fn();

/**
 * Sets up OpenCage reverse geocoding mocks
 * @param city - Default city to return (default: "Test City")
 * @param state - Default state to return (default: "Test State")
 */
export function setupOpenCageMocks(city = "Test City", state = "Test State") {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      results: [
        {
          components: {
            city,
            state,
          },
        },
      ],
    }),
  });
  
  global.fetch = mockFetch as any;
}

/* ============================================================
   NSFW MODEL MOCKS
   ============================================================ */

/**
 * Mock NSFW model object
 */
export const mockNSFWModel = {
  classify: vi.fn(),
};

/**
 * Mock canvas object (must be at top level for vi.mock hoisting)
 */
const mockCanvas = {
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8Array(224 * 224 * 4).fill(128),
    })),
  })),
};

/**
 * Mock loadImage function (must be at top level for vi.mock hoisting)
 */
export const mockLoadImage = vi.fn().mockResolvedValue({} as any);

/**
 * Sets up NSFW model mocks (TensorFlow.js)
 */
export function setupNSFWModelMocks() {
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
    fileTypeFromBuffer: vi.fn().mockResolvedValue({
      mime: "image/png",
      ext: "png",
    }),
  }));

  vi.mock("canvas", () => ({
    createCanvas: vi.fn(() => mockCanvas),
    loadImage: mockLoadImage,
  }));
}

/* ============================================================
   MESSAGE SYSTEM MOCKS
   ============================================================ */

/**
 * Mock function for addSystemMessageToThreads
 */
export const mockAddSystemMessageToThreads = vi.fn();

/**
 * Sets up message system mocks
 */
export function setupMessageMocks() {
  vi.mock("@/lib/messages/addSystemMessageToThreads", () => ({
    addSystemMessageToThreads: (...args: any[]) => mockAddSystemMessageToThreads(...args),
  }));
}

/* ============================================================
   CONTENT MODERATION MOCKS
   ============================================================ */

/**
 * Mock function for profanity filter
 */
export const mockIsProfane = vi.fn().mockReturnValue(false);

/**
 * Mock function for OpenAI moderations
 */
export const mockModerationsCreate = vi.fn().mockResolvedValue({
  results: [{ flagged: false, categories: {} }],
});

/**
 * Sets up content moderation mocks (OpenAI, bad-words)
 */
export function setupModerationMocks() {
  vi.mock("bad-words", () => ({
    Filter: class Filter {
      isProfane = mockIsProfane;
    },
  }));

  vi.mock("openai", () => {
    return {
      __esModule: true,
      default: class OpenAI {
        moderations = {
          create: mockModerationsCreate,
        };
      },
    };
  });
}

/* ============================================================
   COMPLETE SETUP HELPERS
   ============================================================ */

/**
 * Sets up all common mocks for a typical API route test
 * Includes: database, error logger, auth, Resend, OpenCage
 */
export function setupStandardMocks() {
  setupCommonMocks();
  setupAuthMocks();
  setupResendMocks();
  setupOpenCageMocks();
}

/**
 * Sets up all mocks including external services
 * Includes everything from setupStandardMocks plus Cloudinary and NSFW model
 */
export function setupFullMocks() {
  setupStandardMocks();
  setupCloudinaryMocks();
  setupNSFWModelMocks();
  setupMessageMocks();
  setupModerationMocks();
}

/* ============================================================
   RESET HELPERS
   ============================================================ */

/**
 * Resets all mock functions to their initial state
 * Call this in afterEach hooks
 * Note: mockFetch is not reset to preserve OpenCage mock setup
 */
export function resetAllMocks() {
  mockRequireUser.mockReset();
  mockGetServerSession.mockReset();
  mockSendEmail.mockClear();
  mockUploadStream.mockReset();
  mockCloudinaryDestroy.mockReset();
  // Don't reset mockFetch - it's set up by setupOpenCageMocks and should persist
  // Re-setup the default return value to ensure it persists after other resets
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      results: [
        {
          components: {
            city: "Test City",
            state: "Test State",
          },
        },
      ],
    }),
  });
  mockNSFWModel.classify.mockReset();
  mockLoadImage.mockReset();
  mockLoadImage.mockResolvedValue({} as any);
  mockAddSystemMessageToThreads.mockReset();
  mockIsProfane.mockReset();
  mockModerationsCreate.mockReset();
}

