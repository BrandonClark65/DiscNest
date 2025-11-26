import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MarketplaceGrid from "@/components/marketplace/MarketplaceGrid";
import type { Listing } from "@/types/listing";

const { listingCardMock } = vi.hoisted(() => ({
  listingCardMock: vi.fn(
    ({
      listing,
      onDelete,
      onMarkSold,
    }: {
      listing: Listing;
      onDelete?: () => void;
      onMarkSold?: () => void;
    }) => (
      <div data-testid={`listing-${listing._id}`}>
        {listing.title}
        <button onClick={onDelete}>Delete</button>
        <button onClick={onMarkSold}>Mark Sold</button>
      </div>
    )
  ),
}));

vi.mock("@/components/ListingCard", () => ({
  __esModule: true,
  default: listingCardMock,
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => listingCardMock,
}));

const sampleListing: Listing = {
  _id: "1",
  userId: "user-1",
  title: "Test Listing",
  condition: "New",
  type: "Sell",
  imageUrls: [],
};

describe("MarketplaceGrid", () => {
  beforeEach(() => {
    listingCardMock.mockClear();
  });

  test("shows loading state", () => {
    render(
      <MarketplaceGrid
        listings={[]}
        loading
        activeTab="market"
        myListingsTab="active"
        isOwner={() => false}
        onDelete={vi.fn()}
        onMarkSold={vi.fn()}
      />
    );

    expect(screen.getByText(/Loading listings/i)).toBeInTheDocument();
  });

  test("shows empty messages for market and my listings", () => {
    const baseProps = {
      listings: [],
      loading: false,
      isOwner: () => false,
      onDelete: vi.fn(),
      onMarkSold: vi.fn(),
    };

    const { rerender } = render(
      <MarketplaceGrid
        {...baseProps}
        activeTab="market"
        myListingsTab="active"
      />
    );
    expect(screen.getByText(/No listings found/i)).toBeInTheDocument();

    rerender(
      <MarketplaceGrid
        {...baseProps}
        activeTab="myListings"
        myListingsTab="sold"
      />
    );
    expect(screen.getByText(/No sold listings yet/i)).toBeInTheDocument();

    rerender(
      <MarketplaceGrid
        {...baseProps}
        activeTab="myListings"
        myListingsTab="active"
      />
    );
    expect(screen.getByText(/No active listings yet/i)).toBeInTheDocument();
  });

  test("renders listing cards with handlers", async () => {
    const onDelete = vi.fn();
    const onMarkSold = vi.fn();
    const isOwner = vi.fn().mockReturnValue(true);

    render(
      <MarketplaceGrid
        listings={[sampleListing]}
        loading={false}
        activeTab="market"
        myListingsTab="active"
        isOwner={isOwner}
        onDelete={onDelete}
        onMarkSold={onMarkSold}
      />
    );

    await userEvent.click(screen.getByText("Delete"));
    await userEvent.click(screen.getByText("Mark Sold"));

    expect(onDelete).toHaveBeenCalledWith(sampleListing._id);
    expect(onMarkSold).toHaveBeenCalledWith(sampleListing._id);
    expect(isOwner).toHaveBeenCalledWith(sampleListing.userId);
  });
});

