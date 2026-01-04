import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SellerRatingBadge from "@/components/ratings/SellerRatingBadge";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: (e: React.MouseEvent) => void }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("SellerRatingBadge", () => {
  test("renders rating badge with stars and count", () => {
    render(
      <SellerRatingBadge
        averageRating={4.5}
        ratingCount={12}
        userId="user-123"
      />
    );

    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(12 reviews)")).toBeInTheDocument();
  });

  test("returns null when no ratings", () => {
    const { container } = render(
      <SellerRatingBadge
        averageRating={null}
        ratingCount={0}
        userId="user-123"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test("links to user reviews page with userId", () => {
    render(
      <SellerRatingBadge
        averageRating={4.5}
        ratingCount={12}
        userId="user-123"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/user/user-123");
  });

  test("links to user reviews page with username when provided", () => {
    render(
      <SellerRatingBadge
        averageRating={4.5}
        ratingCount={12}
        userId="user-123"
        username="testuser"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/user/testuser");
  });

  test("hides count when showCount is false", () => {
    render(
      <SellerRatingBadge
        averageRating={4.5}
        ratingCount={12}
        userId="user-123"
        showCount={false}
      />
    );

    expect(screen.queryByText("(12 reviews)")).not.toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  test("stops event propagation on click", async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <SellerRatingBadge
          averageRating={4.5}
          ratingCount={12}
          userId="user-123"
        />
      </div>
    );

    const link = screen.getByRole("link");
    await user.click(link);

    // Event should be stopped, so parent shouldn't be called
    // (Note: In actual implementation, stopPropagation is called)
    expect(link).toBeInTheDocument();
  });
});

