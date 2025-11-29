// tests/integration/api/edge-cases-shared-setup.ts
// Shared mocks and setup for edge case tests
import { vi } from "vitest";

/* ----------------------------------------------------
   MOCK DATABASE
---------------------------------------------------- */
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: async () => {},
}));

/* ----------------------------------------------------
   MOCK ERROR LOGGER
---------------------------------------------------- */
vi.mock("@/lib/errorLogger", () => ({
  logError: vi.fn(),
}));

/* ----------------------------------------------------
   MOCK withErrorHandling
---------------------------------------------------- */
vi.mock("@/lib/withErrorHandling", () => ({
  withErrorHandling: (handler: any) => handler,
}));

/* ----------------------------------------------------
   MOCK requireUser
---------------------------------------------------- */
export const mockRequireUser = vi.fn();
vi.mock("@/lib/auth/requireUser", () => ({
  requireUser: () => mockRequireUser(),
}));

/* ----------------------------------------------------
   MOCK withUserAuth
---------------------------------------------------- */
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

/* ----------------------------------------------------
   MOCK Resend
---------------------------------------------------- */
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: vi.fn().mockResolvedValue({ id: "email-123" }),
    };
  },
}));

/* ----------------------------------------------------
   MOCK fetch for reverse geocoding
---------------------------------------------------- */
global.fetch = vi.fn().mockResolvedValue({
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
}) as any;

/* ----------------------------------------------------
   MOCK Cloudinary
---------------------------------------------------- */
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

/* ----------------------------------------------------
   MOCK addSystemMessageToThreads
---------------------------------------------------- */
export const mockAddSystemMessageToThreads = vi.fn();
vi.mock("@/lib/messages/addSystemMessageToThreads", () => ({
  addSystemMessageToThreads: (...args: any[]) => mockAddSystemMessageToThreads(...args),
}));

/* ----------------------------------------------------
   MOCK OpenAI (for message moderation)
---------------------------------------------------- */
vi.mock("openai", () => {
  const mockModerationsCreate = vi.fn().mockResolvedValue({
    results: [{ flagged: false, categories: {} }],
  });

  return {
    __esModule: true,
    default: class OpenAI {
      moderations = {
        create: mockModerationsCreate,
      };
    },
  };
});

/* ----------------------------------------------------
   MOCK bad-words (for profanity filter)
---------------------------------------------------- */
export const mockIsProfane = vi.fn().mockReturnValue(false);
vi.mock("bad-words", () => ({
  Filter: class Filter {
    isProfane = mockIsProfane;
  },
}));

/* ----------------------------------------------------
   MOCK next-auth (for messages route)
---------------------------------------------------- */
export const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

