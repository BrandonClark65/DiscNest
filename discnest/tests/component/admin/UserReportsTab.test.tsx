import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UserReportsTab from "@/components/admin/UserReportsTab";

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(
    ({ label, onClick }: { label: string; onClick?: () => void }) => (
      <button onClick={onClick}>{label}</button>
    )
  )
);

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

vi.mock("lucide-react", () => ({
  ShieldAlert: () => <span>🛡️</span>,
  CheckCircle: () => <span>✓</span>,
  XCircle: () => <span>✗</span>,
  Ban: () => <span>🚫</span>,
}));

const mockReports = [
  {
    _id: "report-1",
    status: "pending",
    reason: "Inappropriate behavior",
    reporter: { name: "Reporter", email: "reporter@test.com" },
    reportedUser: { name: "Reported", email: "reported@test.com" },
    createdAt: "2023-01-01",
  },
];

describe("UserReportsTab", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => mockReports,
    });
    gradientButtonMock.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("fetches and displays reports", async () => {
    render(<UserReportsTab />);

    await waitFor(() => {
      expect(screen.getByText("Inappropriate behavior")).toBeInTheDocument();
    });
    expect(screen.getByText(/Reporter:/)).toBeInTheDocument();
  });

  test("shows status badge", async () => {
    render(<UserReportsTab />);

    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  test("takes action on pending report", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => mockReports,
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        json: async () => [],
      });
    global.fetch = fetchMock;

    render(<UserReportsTab />);

    await waitFor(() => {
      expect(screen.getByText("Inappropriate behavior")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Resolve" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/reports/report-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve" }),
      });
    });
  });
});

