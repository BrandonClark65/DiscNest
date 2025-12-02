import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DiscsTab from "@/components/admin/DiscsTab";

const paginationMock = vi.hoisted(() =>
  vi.fn(({ onPageChange }: any) => (
    <button onClick={() => onPageChange(2)}>Next</button>
  ))
);

vi.mock("@/components/admin/Pagination", () => ({
  __esModule: true,
  default: paginationMock,
}));

const mockDiscs = [
  {
    _id: "1",
    name: "Buzzz",
    brand: "Discraft",
    type: "Midrange",
    addedAt: "2023-01-01",
  },
  {
    _id: "2",
    name: "Teebird",
    brand: "Innova",
    type: "Fairway Driver",
    addedAt: "2023-01-02",
  },
];

describe("DiscsTab", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => mockDiscs,
    });
    paginationMock.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("fetches and displays discs", async () => {
    render(<DiscsTab />);

    await waitFor(() => {
      expect(screen.getByText("Buzzz")).toBeInTheDocument();
    });
    expect(screen.getByText("Teebird")).toBeInTheDocument();
  });

  test("filters by search term", async () => {
    const user = userEvent.setup();
    render(<DiscsTab />);

    await waitFor(() => {
      expect(screen.getByText("Buzzz")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by name or type");
    await user.type(searchInput, "Buzzz");

    expect(screen.getByText("Buzzz")).toBeInTheDocument();
    expect(screen.queryByText("Teebird")).not.toBeInTheDocument();
  });

  test("filters by brand", async () => {
    const user = userEvent.setup();
    render(<DiscsTab />);

    await waitFor(() => {
      expect(screen.getByText("Buzzz")).toBeInTheDocument();
    });

    const brandSelect = screen.getByRole("combobox");
    await user.selectOptions(brandSelect, "Innova");

    expect(screen.getByText("Teebird")).toBeInTheDocument();
    expect(screen.queryByText("Buzzz")).not.toBeInTheDocument();
  });
});

