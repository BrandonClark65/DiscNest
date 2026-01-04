import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SellerInfo from "@/components/listing/SellerInfo";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// Mock MessageSellerButton
vi.mock("@/components/MessageSellerButton", () => ({
  default: ({ sellerId }: { sellerId: string }) => (
    <button>Message Seller {sellerId}</button>
  ),
}));

// Mock SellerRatingBadge
vi.mock("@/components/ratings/SellerRatingBadge", () => ({
  default: ({ userId, username }: { userId: string; username?: string }) => (
    <div data-testid="rating-badge">
      Rating for {username || userId}
    </div>
  ),
}));

describe("SellerInfo", () => {
  const mockSeller = {
    _id: "seller-123",
    name: "John Seller",
    username: "johnseller",
    avatarUrl: "https://example.com/avatar.jpg",
    averageRating: 4.5,
    ratingCount: 12,
  };

  test("displays seller name and avatar", () => {
    render(<SellerInfo seller={mockSeller} listingId="listing-123" />);

    expect(screen.getByText("John Seller")).toBeInTheDocument();
    expect(screen.getByAltText("John Seller")).toBeInTheDocument();
  });

  test("displays rating badge", () => {
    render(<SellerInfo seller={mockSeller} listingId="listing-123" />);

    expect(screen.getByTestId("rating-badge")).toBeInTheDocument();
  });

  test("shows message seller button", () => {
    render(<SellerInfo seller={mockSeller} listingId="listing-123" />);

    expect(screen.getByRole("button", { name: /Message Seller/i })).toBeInTheDocument();
  });

  test("links to seller reviews page", () => {
    render(<SellerInfo seller={mockSeller} listingId="listing-123" />);

    const links = screen.getAllByRole("link");
    const reviewsLink = links.find((link) => link.getAttribute("href") === "/user/johnseller");
    expect(reviewsLink).toBeInTheDocument();
  });

  test("uses userId when username not available", () => {
    const sellerWithoutUsername = {
      ...mockSeller,
      username: undefined,
    };

    render(<SellerInfo seller={sellerWithoutUsername} listingId="listing-123" />);

    const links = screen.getAllByRole("link");
    const reviewsLink = links.find((link) => link.getAttribute("href") === "/user/seller-123");
    expect(reviewsLink).toBeInTheDocument();
  });

  test("shows fallback avatar when no avatarUrl", () => {
    const sellerWithoutAvatar = {
      ...mockSeller,
      avatarUrl: undefined,
    };

    render(<SellerInfo seller={sellerWithoutAvatar} listingId="listing-123" />);

    // Should show initial letter
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  test("handles seller without name", () => {
    const sellerWithoutName = {
      ...mockSeller,
      name: undefined,
    };

    render(<SellerInfo seller={sellerWithoutName} listingId="listing-123" />);

    expect(screen.getByText("johnseller")).toBeInTheDocument();
  });
});

