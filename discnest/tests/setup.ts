import "@testing-library/jest-dom";
import { vi } from "vitest";

/**
 * Global mock for next-auth/react.
 * Ensures useSession is always a vi.fn so tests can override it.
 */
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
}));

/**
 * (Optional) Global mock for react-hot-toast to avoid noisy console output.
 */
vi.mock("react-hot-toast", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
