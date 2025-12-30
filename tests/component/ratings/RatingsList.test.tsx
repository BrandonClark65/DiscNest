import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RatingsList from "@/components/ratings/RatingsList";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockRatings = [
  {
    _id: "rating-1",
    rating: 5,
    review: "Excellent seller!",
    createdAt: new Date("2024-01-15").toISOString(),
    rater: {
      _id: "rater-1",
      name: "John Doe",
      username: "johndoe",
      avatarUrl: "https://example.com/avatar1.jpg",
    },
  },
  {
    _id: "rating-2",
    rating: 4,
    review: "Good experience",
    createdAt: new Date("2024-01-10").toISOString(),
    rater: {
      _id: "rater-2",
      name: "Jane Smith",
      username: "janesmith",
    },
  },
  {
    _id: "rating-3",
    rating: 3,
    createdAt: new Date("2024-01-05").toISOString(),
    rater: null, // Anonymous rating
  },
];

describe("RatingsList", () => {
  test("displays summary with average rating and count", () => {
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
      />
    );

    expect(screen.getByText("3 Reviews")).toBeInTheDocument();
    expect(screen.getByText("4.0 out of 5")).toBeInTheDocument();
  });

  test("shows 'No ratings yet' when empty", () => {
    render(
      <RatingsList
        ratings={[]}
        averageRating={null}
        ratingCount={0}
      />
    );

    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
  });

  test("displays all ratings with reviews", () => {
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
      />
    );

    expect(screen.getByText("Excellent seller!")).toBeInTheDocument();
    expect(screen.getByText("Good experience")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  test("displays rating stars correctly", () => {
    const { container } = render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
      />
    );

    // Check for filled stars (5-star rating should have 5 filled)
    const filledStars = container.querySelectorAll('.fill-yellow-400');
    expect(filledStars.length).toBeGreaterThan(0);
  });

  test("handles anonymous ratings", () => {
    render(
      <RatingsList
        ratings={[mockRatings[2]]}
        averageRating={3.0}
        ratingCount={1}
      />
    );

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  test("displays formatted dates", () => {
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
      />
    );

    // Dates should be formatted (check for date-like text)
    const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  test("shows pagination controls when multiple pages", () => {
    const onPageChange = vi.fn();
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
        currentPage={1}
        totalPages={2}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });

  test("disables previous button on first page", () => {
    const onPageChange = vi.fn();
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
        currentPage={1}
        totalPages={2}
        onPageChange={onPageChange}
      />
    );

    const prevButton = screen.getByRole("button", { name: /Previous/i });
    expect(prevButton).toBeDisabled();
  });

  test("disables next button on last page", () => {
    const onPageChange = vi.fn();
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
        currentPage={2}
        totalPages={2}
        onPageChange={onPageChange}
      />
    );

    const nextButton = screen.getByRole("button", { name: /Next/i });
    expect(nextButton).toBeDisabled();
  });

  test("calls onPageChange when pagination buttons clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
        currentPage={2}
        totalPages={2}
        onPageChange={onPageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /Previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("does not show pagination when single page", () => {
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.0}
        ratingCount={3}
        currentPage={1}
        totalPages={1}
      />
    );

    expect(screen.queryByRole("button", { name: /Previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Next/i })).not.toBeInTheDocument();
  });
});

