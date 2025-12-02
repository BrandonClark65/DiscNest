import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MarketplaceTabs from "@/components/marketplace/MarketplaceTabs";

const { gradientButtonMock } = vi.hoisted(() => ({
  gradientButtonMock: vi.fn(
    ({ label, onClick }: { label: string; onClick?: () => void }) => (
      <button onClick={onClick}>{label}</button>
    )
  ),
}));

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

describe("MarketplaceTabs", () => {
  beforeEach(() => {
    gradientButtonMock.mockClear();
  });

  test("renders tabs and switches active tab", async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();

    render(
      <MarketplaceTabs
        activeTab="market"
        setActiveTab={setActiveTab}
        myListingsTab="active"
        setMyListingsTab={vi.fn()}
        includeRequestsTab
      />
    );

    expect(screen.getByRole("button", { name: "Marketplace" })).toHaveClass(
      "border-b-2",
      { exact: false }
    );
    expect(screen.getByRole("button", { name: "Requests" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "My Listings" }));
    expect(setActiveTab).toHaveBeenCalledWith("myListings");
  });

  test("shows my listings sub tabs when userId is present", async () => {
    const user = userEvent.setup();
    const setMyListingsTab = vi.fn();

    render(
      <MarketplaceTabs
        activeTab="myListings"
        setActiveTab={vi.fn()}
        myListingsTab="active"
        setMyListingsTab={setMyListingsTab}
        userId="user-1"
      />
    );

    expect(screen.getByRole("button", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sold" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sold" }));
    expect(setMyListingsTab).toHaveBeenCalledWith("sold");
  });

  test("does not render sub tabs without user", () => {
    render(
      <MarketplaceTabs
        activeTab="myListings"
        setActiveTab={vi.fn()}
        myListingsTab="active"
        setMyListingsTab={vi.fn()}
      />
    );

    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });
});

