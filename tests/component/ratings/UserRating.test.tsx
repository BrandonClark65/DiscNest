import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UserRating from "@/components/ratings/UserRating";

describe("UserRating", () => {
  test("displays rating with stars and count", () => {
    render(<UserRating averageRating={4.5} ratingCount={23} />);

    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(23 reviews)")).toBeInTheDocument();
  });

  test("shows 'No ratings yet' when no ratings", () => {
    render(<UserRating averageRating={null} ratingCount={0} />);

    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
  });

  test("handles single review correctly", () => {
    render(<UserRating averageRating={5.0} ratingCount={1} />);

    expect(screen.getByText("(1 review)")).toBeInTheDocument();
  });

  test("displays correct number of filled stars", () => {
    const { container } = render(<UserRating averageRating={3.5} ratingCount={10} />);

    // Should have 4 filled stars (rounded from 3.5)
    const filledStars = container.querySelectorAll('.fill-yellow-400');
    expect(filledStars.length).toBeGreaterThanOrEqual(4);
  });

  test("supports different sizes", () => {
    const { container: smContainer } = render(
      <UserRating averageRating={4.0} ratingCount={5} size="sm" />
    );
    const { container: lgContainer } = render(
      <UserRating averageRating={4.0} ratingCount={5} size="lg" />
    );

    // Check that size classes are applied
    expect(smContainer.querySelector('.w-3')).toBeInTheDocument();
    expect(lgContainer.querySelector('.w-5')).toBeInTheDocument();
  });

  test("hides label when showLabel is false", () => {
    render(<UserRating averageRating={4.5} ratingCount={10} showLabel={false} />);

    expect(screen.queryByText("(10 reviews)")).not.toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });
});

