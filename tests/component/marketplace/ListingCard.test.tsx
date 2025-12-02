import { vi, describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/types/listing";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(
    ({
      label,
      onClick,
      href,
    }: {
      label: string;
      onClick?: () => void;
      href?: string;
    }) =>
      href ? (
        <a href={href} onClick={onClick}>
          {label}
        </a>
      ) : (
        <button onClick={onClick}>{label}</button>
      )
  )
);

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

const listing: Listing = {
  _id: "listing-1",
  userId: "user-1",
  title: "Great Disc",
  brand: "Innova",
  condition: "New",
  type: "Sell",
  price: 25,
  imageUrls: ["https://example.com/disc.jpg"],
  city: "City",
  state: "State",
  location: { coordinates: [0, 0] },
};

describe("ListingCard", () => {
  test("renders listing info and view button", () => {
    render(<ListingCard listing={listing} />);

    expect(screen.getByText("Great Disc")).toBeInTheDocument();
    expect(screen.getByText("Innova • New")).toBeInTheDocument();
    expect(screen.getByText("City, State")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(gradientButtonMock).toHaveBeenCalledWith(
      expect.objectContaining({ label: "View Listing", href: "/listing/listing-1" }),
      undefined
    );
  });

  test("calls owner actions when buttons clicked", async () => {
    const onDelete = vi.fn();
    const onMarkSold = vi.fn();
    const user = userEvent.setup();

    render(
      <ListingCard
        listing={listing}
        isOwner
        onDelete={onDelete}
        onMarkSold={onMarkSold}
      />
    );

    await user.click(screen.getByRole("button", { name: "Sold" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onMarkSold).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  test("shows sold overlay", () => {
    render(<ListingCard listing={{ ...listing, sold: true }} isOwner />);

    expect(screen.getByText(/Sold/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sold" })).not.toBeInTheDocument();
  });
});

