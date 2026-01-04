import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";

import EbayPriceResearch from "@/components/marketplace/EbayPriceResearch";

const toastMock = vi.hoisted(() => {
  const fn = vi.fn() as any;
  fn.success = vi.fn();
  fn.error = vi.fn();
  return fn;
});

vi.mock("react-hot-toast", () => ({
  default: toastMock,
  toast: toastMock,
}));

const originalFetch = global.fetch;

const makeResponse = (data: any, ok = true) => ({
  ok,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

describe("EbayPriceResearch", () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("renders collapsed by default", () => {
    render(<EbayPriceResearch title="Destroyer" brand="Innova" />);

    expect(screen.getByText(/Research eBay Sold Prices/i)).toBeInTheDocument();
    expect(screen.queryByText(/Search eBay for sold listings/i)).not.toBeInTheDocument();
  });

  test("expands when clicked", async () => {
    const user = userEvent.setup();
    render(<EbayPriceResearch title="Destroyer" brand="Innova" />);

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton!);

    expect(screen.getByText(/Search eBay for sold listings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title\/Disc Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Brand/i)).toBeInTheDocument();
  });

  test("auto-populates fields from props", async () => {
    const user = userEvent.setup();
    render(
      <EbayPriceResearch
        title="Destroyer"
        brand="Innova"
        plastic="Star"
        condition="New"
      />
    );

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    await user.click(toggleButton!);

    await waitFor(() => {
      expect(screen.getByLabelText(/Title\/Disc Name/i)).toHaveValue("Destroyer");
      expect(screen.getByLabelText(/Brand/i)).toHaveValue("Innova");
      expect(screen.getByLabelText(/Plastic/i)).toHaveValue("Star");
      expect(screen.getByLabelText(/Condition/i)).toHaveValue("New");
    });
  });

  test("allows editing search fields", async () => {
    const user = userEvent.setup();
    render(<EbayPriceResearch title="Destroyer" brand="Innova" />);

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    await user.click(toggleButton!);

    const titleInput = screen.getByLabelText(/Title\/Disc Name/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Buzzz");

    expect(titleInput).toHaveValue("Buzzz");
  });

  test("shows error toast when searching without title or brand", async () => {
    const user = userEvent.setup();
    render(<EbayPriceResearch />);

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    await user.click(toggleButton!);

    const searchButton = screen.getByRole("button", { name: /Search eBay Sold Listings/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Please enter at least a title or brand to search"
      );
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("calls API endpoint with correct parameters", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        success: true,
        source: "url",
        searchUrl: "https://www.ebay.com/sch/i.html?_nkw=Innova+Destroyer+disc+golf&LH_Sold=1",
      })
    );

    render(<EbayPriceResearch title="Destroyer" brand="Innova" />);

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    await user.click(toggleButton!);

    const searchButton = screen.getByRole("button", { name: /Search eBay Sold Listings/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("/api/ebay/search");
      expect(callUrl).toContain("title=Destroyer");
      expect(callUrl).toContain("brand=Innova");
    });
  });

  test("displays URL link when search completes", async () => {
    const user = userEvent.setup();
    const searchUrl = "https://www.ebay.com/sch/i.html?_nkw=Test";
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        success: true,
        source: "url",
        searchUrl,
        message: "Click the link to view sold listings on eBay.",
      })
    );

    render(<EbayPriceResearch title="Test" brand="Test" />);

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    await user.click(toggleButton!);

    const searchButton = screen.getByRole("button", { name: /Search eBay Sold Listings/i });
    await user.click(searchButton);

    await waitFor(() => {
      const link = screen.getByRole("link", { name: /View Sold Listings on eBay/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", searchUrl);
      expect(link).toHaveAttribute("target", "_blank");
    });

    expect(toastMock.success).toHaveBeenCalled();
  });


  test("handles API errors gracefully", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce(
      makeResponse(
        {
          error: "Failed to search eBay",
        },
        false
      )
    );

    render(<EbayPriceResearch title="Test" brand="Test" />);

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    await user.click(toggleButton!);

    const searchButton = screen.getByRole("button", { name: /Search eBay Sold Listings/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Failed to search eBay");
    });
  });


  test("shows loading state during search", async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise);

    render(<EbayPriceResearch title="Test" brand="Test" />);

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    await user.click(toggleButton!);

    const searchButton = screen.getByRole("button", { name: /Search eBay Sold Listings/i });
    await user.click(searchButton);

    // Check loading state
    expect(screen.getByText(/Searching.../i)).toBeInTheDocument();
    expect(searchButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!(
      makeResponse({
        success: true,
        source: "url",
        searchUrl: "https://www.ebay.com/sch/i.html",
      })
    );

    await waitFor(() => {
      expect(screen.queryByText(/Searching.../i)).not.toBeInTheDocument();
    });
  });

  test("updates fields when props change", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <EbayPriceResearch title="Destroyer" brand="Innova" />
    );

    const toggleButton = screen.getByText(/Research eBay Sold Prices/i).closest("button");
    await user.click(toggleButton!);

    await waitFor(() => {
      expect(screen.getByLabelText(/Title\/Disc Name/i)).toHaveValue("Destroyer");
    });

    // Update props
    rerender(
      <EbayPriceResearch title="Buzzz" brand="Discraft" plastic="ESP" />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Title\/Disc Name/i)).toHaveValue("Buzzz");
      expect(screen.getByLabelText(/Brand/i)).toHaveValue("Discraft");
      expect(screen.getByLabelText(/Plastic/i)).toHaveValue("ESP");
    });
  });

});

