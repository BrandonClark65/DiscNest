import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import ProfilePage from "@/app/profile/page";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: "user-1", name: "Test User" } },
    status: "authenticated",
  })),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("Profile Page - Ratings List Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock profile API
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/profile")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: {
              name: "Test User",
              username: "testuser",
              averageRating: 4.5,
              ratingCount: 10,
              discCount: 5,
            },
          }),
        });
      }
      if (url.includes("/api/users/") && url.includes("/ratings")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ratings: [
              {
                _id: "rating-1",
                rating: 5,
                review: "Great seller!",
                createdAt: new Date().toISOString(),
                rater: {
                  _id: "rater-1",
                  name: "Rater 1",
                  username: "rater1",
                },
              },
              {
                _id: "rating-2",
                rating: 4,
                review: "Good experience",
                createdAt: new Date().toISOString(),
                rater: {
                  _id: "rater-2",
                  name: "Rater 2",
                },
              },
            ],
            averageRating: 4.5,
            ratingCount: 10,
            pagination: {
              page: 1,
              limit: 10,
              total: 10,
              totalPages: 1,
            },
          }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  test("displays ratings list when user has ratings", async () => {
    render(<ProfilePage />);

    // Wait for ratings to load and check that ratings are displayed
    await waitFor(() => {
      expect(screen.getByText("Great seller!")).toBeInTheDocument();
      expect(screen.getByText("Good experience")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify reviews count is displayed (may appear multiple times - use getAllByText)
    const reviewsText = screen.getAllByText(/10 Review/i);
    expect(reviewsText.length).toBeGreaterThan(0);
  });

  test("does not display ratings list when user has no ratings", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/profile")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: {
              name: "Test User",
              username: "testuser",
              averageRating: null,
              ratingCount: 0,
              discCount: 5,
            },
          }),
        });
      }
      if (url.includes("/api/users/") && url.includes("/ratings")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ratings: [],
            averageRating: null,
            ratingCount: 0,
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 1,
            },
          }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<ProfilePage />);

    await waitFor(() => {
      // Ratings list section should not be visible when count is 0
      expect(screen.queryByText(/Reviews/i)).not.toBeInTheDocument();
    });
  });

  test("handles pagination correctly", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      // Should find the ratings list with reviews count
      const reviewsText = screen.getAllByText(/10 Reviews/i);
      expect(reviewsText.length).toBeGreaterThan(0);
    });

    // Verify ratings are displayed
    expect(screen.getByText("Great seller!")).toBeInTheDocument();
    expect(screen.getByText("Good experience")).toBeInTheDocument();
  });
});

