import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PendingListingsTab from "@/components/admin/PendingListingsTab";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="listing-image" />,
}));

const mockListings = [
  {
    _id: "listing-1",
    title: "Test Disc",
    brand: "Innova",
    condition: "New",
    price: 20,
    userId: { name: "Seller", email: "seller@test.com" },
    imageUrls: ["/image1.jpg"],
    createdAt: "2023-01-01",
  },
];

describe("PendingListingsTab", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ listings: mockListings }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("fetches and displays pending listings", async () => {
    render(<PendingListingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Test Disc")).toBeInTheDocument();
    });
    expect(screen.getByText("Innova")).toBeInTheDocument();
  });

  test("approves listing", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({ listings: mockListings }),
      })
      .mockResolvedValueOnce({ ok: true });
    global.fetch = fetchMock;

    render(<PendingListingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Test Disc")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: "listing-1", action: "approve" }),
      });
    });
  });

  test("rejects listing", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({ listings: mockListings }),
      })
      .mockResolvedValueOnce({ ok: true });
    global.fetch = fetchMock;

    render(<PendingListingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Test Disc")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: "listing-1", action: "reject" }),
      });
    });
  });
});

