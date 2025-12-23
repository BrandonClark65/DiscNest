import { vi, describe, test, expect, beforeEach, afterAll, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import the component - mocks will be applied before it's used
import ListingPage from "@/app/listing/[id]/page";

const paramsMock = vi.fn();
const useParamsMock = paramsMock;

const sessionMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));
const useSessionMock = sessionMocks.useSession;

vi.mock("next/navigation", () => ({
  useParams: () => useParamsMock(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img data-testid="listing-image" {...props} />,
}));

vi.mock("@/components/ui/ShareButton", () => ({
  __esModule: true,
  default: () => <button>Share</button>,
}));

vi.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => <nav>Breadcrumbs</nav>,
}));

vi.mock("@/components/MessageSellerButton", () => ({
  __esModule: true,
  default: () => <button>Message Seller</button>,
}));

vi.mock("@/components/Map", () => ({
  __esModule: true,
  default: () => <div data-testid="map">Map</div>,
}));

const reportModalMock = vi.fn((props?: any) => props);
const editListingModalMock = vi.fn((props?: any) => props);

vi.mock("@/components/modals/ReportModal", () => ({
  __esModule: true,
  default: (props: any) => {
    reportModalMock(props);
    return props.open ? <div data-testid="report-open" /> : null;
  },
}));

vi.mock("@/components/modals/EditListingModal", () => ({
  __esModule: true,
  default: (props: any) => {
    editListingModalMock(props);
    return props.open ? (
      <div data-testid="edit-modal">
        <button onClick={props.onClose} data-testid="edit-close-button">
          Close
        </button>
      </div>
    ) : null;
  },
}));

const toastMocks = vi.hoisted(() => {
  const fn = vi.fn();
  fn.success = vi.fn();
  fn.error = vi.fn();
  return fn;
});

vi.mock("react-hot-toast", () => ({
  default: toastMocks,
  toast: toastMocks,
}));

const analyticsMock = {
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
};

vi.mock("@/lib/useAnalytics", () => ({
  useAnalytics: () => analyticsMock,
}));

const baseListing = {
  _id: "listing-123",
  userId: "user-123",
  title: "Test Disc",
  description: "A great disc",
  brand: "Innova",
  type: "Sell",
  condition: "New",
  price: 25,
  imageUrls: ["https://example.com/image.jpg"],
  listingType: "single" as const,
  location: {
    coordinates: [-118, 34] as [number, number],
  },
};

describe("ListingPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    paramsMock.mockReturnValue({ id: "listing-123" });
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({ data: null });
    reportModalMock.mockClear();
    editListingModalMock.mockClear();
    toastMocks.mockClear();
    toastMocks.success.mockClear();
    toastMocks.error.mockClear();
    analyticsMock.trackEvent.mockClear();
    analyticsMock.trackPageView.mockClear();
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("shows loading state initially", () => {
    (global.fetch as Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ListingPage />);

    expect(screen.getByText(/Loading listing.../i)).toBeInTheDocument();
  });

  test("fetches and displays listing", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ listing: baseListing }),
    });

    render(<ListingPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Disc")).toBeInTheDocument();
    });

    expect(screen.getByText("A great disc")).toBeInTheDocument();
    expect(screen.getByText("Innova")).toBeInTheDocument();
  });

  test("shows edit button in menu when user is owner", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123" } },
    });

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ listing: baseListing }),
    });

    render(<ListingPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Disc")).toBeInTheDocument();
    });

    // Find the three dots button (MoreVertical icon button)
    const menuButton = screen.getByRole("button", { name: /More Options/i });
    await userEvent.click(menuButton);

    expect(screen.getByText(/Edit Listing/i)).toBeInTheDocument();
    expect(screen.queryByText(/Report User/i)).not.toBeInTheDocument();
  });

  test("shows report button in menu when user is not owner", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "other-user" } },
    });

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ listing: baseListing }),
    });

    render(<ListingPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Disc")).toBeInTheDocument();
    });

    const menuButton = screen.getByRole("button", { name: /More Options/i });
    await userEvent.click(menuButton);

    expect(screen.getByText(/Report User/i)).toBeInTheDocument();
    expect(screen.queryByText(/Edit Listing/i)).not.toBeInTheDocument();
  });

  test("opens edit modal when edit button is clicked", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123" } },
    });

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ listing: baseListing }),
    });

    render(<ListingPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Disc")).toBeInTheDocument();
    });

    const menuButton = screen.getByRole("button", { name: /More Options/i });
    await userEvent.click(menuButton);
    await userEvent.click(screen.getByText(/Edit Listing/i));

    expect(editListingModalMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        listing: expect.objectContaining({
          _id: "listing-123",
          title: "Test Disc",
        }),
      })
    );
    expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
  });

  test("refreshes listing data when edit succeeds", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123" } },
    });

    (global.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ listing: baseListing }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          listing: { ...baseListing, title: "Updated Title" },
        }),
      });

    render(<ListingPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Disc")).toBeInTheDocument();
    });

    const menuButton = screen.getByRole("button", { name: /More Options/i });
    await userEvent.click(menuButton);
    await userEvent.click(screen.getByText(/Edit Listing/i));

    await waitFor(() => {
      expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
    });

    // Simulate onSuccess callback
    const editProps = editListingModalMock.mock.calls[editListingModalMock.mock.calls.length - 1][0];
    if (editProps.onSuccess) {
      editProps.onSuccess();
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/listings/listing-123");
    });
  });

  test("handles error when fetching listing", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<ListingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Listing not found/i)).toBeInTheDocument();
    });
  });
});

