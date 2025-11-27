import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import StatsTab from "@/components/admin/StatsTab";

const lineChartMock = vi.hoisted(() =>
  vi.fn(({ data }: any) => <div data-testid="chart">{JSON.stringify(data)}</div>)
);

vi.mock("react-chartjs-2", () => ({
  Line: lineChartMock,
}));

vi.mock("chart.js", () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

const mockStats = [
  { date: "2023-01-01", count: 10 },
  { date: "2023-01-02", count: 15 },
];

describe("StatsTab", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => mockStats,
    });
    lineChartMock.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("fetches and displays stats chart", async () => {
    render(<StatsTab />);

    await waitFor(() => {
      expect(lineChartMock).toHaveBeenCalled();
    });

    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });

  test("triggers seed script", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => mockStats,
      })
      .mockResolvedValueOnce({ ok: true });
    global.fetch = fetchMock;

    render(<StatsTab />);

    await waitFor(() => {
      expect(lineChartMock).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /Run Seed Script/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/seed", {
        method: "POST",
      });
    });
  });
});

