import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ErrorsTab from "@/components/admin/ErrorsTab";

const paginationMock = vi.hoisted(() =>
  vi.fn(({ onPageChange }: any) => (
    <button onClick={() => onPageChange(2)}>Next</button>
  ))
);

vi.mock("@/components/admin/Pagination", () => ({
  __esModule: true,
  default: paginationMock,
}));

vi.mock("lucide-react", () => ({
  X: () => <span>×</span>,
}));

const mockErrors = [
  {
    _id: "error-1",
    message: "Test error",
    route: "/test",
    severity: "high",
    source: "client",
    createdAt: "2023-01-01",
    resolved: false,
  },
];

describe("ErrorsTab", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ logs: mockErrors }),
    });
    paginationMock.mockClear();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("fetches and displays error logs", async () => {
    render(<ErrorsTab />);

    await waitFor(() => {
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  test("opens modal when viewing error", async () => {
    const user = userEvent.setup();
    render(<ErrorsTab />);

    await waitFor(() => {
      expect(screen.getAllByText("Test error")[0]).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "View" }));

    expect(screen.getByText("Error Details")).toBeInTheDocument();
    expect(screen.getAllByText(/Test error/).length).toBeGreaterThan(0);
  });

  test("marks error as resolved", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({ logs: mockErrors }),
      })
      .mockResolvedValueOnce({ ok: true });
    global.fetch = fetchMock;

    render(<ErrorsTab />);

    await waitFor(() => {
      expect(screen.getAllByText("Test error")[0]).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Mark Resolved" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/errors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "error-1", resolved: true }),
      });
    });
  });
});

