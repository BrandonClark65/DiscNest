import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HandicapCalculator from "@/components/handicap/HandicapCalculator";

const mockUseSession = vi.hoisted(() => vi.fn());
vi.mock("next-auth/react", () => ({ useSession: mockUseSession }));

const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
vi.mock("react-hot-toast", () => {
  const toastFn = vi.fn() as never as { success: unknown; error: unknown };
  toastFn.success = mockToastSuccess;
  toastFn.error = mockToastError;
  return { default: toastFn };
});

// chart.js does not render under jsdom; the chart itself is not under test here.
vi.mock("react-chartjs-2", () => ({ Line: () => <div data-testid="chart" /> }));

const PENDING_KEY = "discnest:handicap:pending-rounds";

const loggedOut = () => mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
const loggedIn = () =>
  mockUseSession.mockReturnValue({
    data: { user: { id: "u1" } },
    status: "authenticated",
  });

/** Enter one PDGA round through the form. */
async function addRound(user: ReturnType<typeof userEvent.setup>, rating: string) {
  await user.type(screen.getByLabelText(/PDGA round rating/i), rating);
  await user.click(screen.getByRole("button", { name: /Add round/i }));
}

describe("HandicapCalculator - logged-out persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => window.localStorage.clear());

  test("persists logged-out rounds so navigating to login cannot lose them", async () => {
    loggedOut();
    const user = userEvent.setup();
    render(<HandicapCalculator />);

    await addRound(user, "942");

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(PENDING_KEY) ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].computedRating).toBe(942);
      // The original payload must ride along so the round can be replayed.
      expect(stored[0].payload).toBeTruthy();
    });
  });

  test("restores rounds on a fresh mount, as after returning from login", async () => {
    loggedOut();
    window.localStorage.setItem(
      PENDING_KEY,
      JSON.stringify([
        {
          source: "pdga",
          date: new Date("2026-03-01").toISOString(),
          holes: 18,
          computedRating: 955,
          estimated: false,
          payload: { source: "pdga", date: "2026-03-01", holes: 18, providedRating: 955 },
        },
      ])
    );

    render(<HandicapCalculator />);

    expect(await screen.findByText("955")).toBeInTheDocument();
  });

  test("clears storage once the last round is removed", async () => {
    loggedOut();
    const user = userEvent.setup();
    render(<HandicapCalculator />);

    await addRound(user, "942");
    await waitFor(() =>
      expect(window.localStorage.getItem(PENDING_KEY)).toContain("942")
    );

    await user.click(await screen.findByRole("button", { name: /delete round/i }));

    await waitFor(() => expect(window.localStorage.getItem(PENDING_KEY)).toBeNull());
  });
});

describe("HandicapCalculator - claiming rounds after login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => window.localStorage.clear());

  test("offers to save rounds entered before signing in", async () => {
    window.localStorage.setItem(
      PENDING_KEY,
      JSON.stringify([
        {
          source: "pdga",
          date: new Date("2026-03-01").toISOString(),
          holes: 18,
          computedRating: 955,
          estimated: false,
          payload: { source: "pdga", date: "2026-03-01", holes: 18, providedRating: 955 },
        },
      ])
    );
    loggedIn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rounds: [], handicap: null, snapshots: [] }),
    });

    render(<HandicapCalculator />);

    expect(await screen.findByText(/1 unsaved round/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save 1 to my account/i })
    ).toBeInTheDocument();
  });

  test("posts each pending round and clears storage on save", async () => {
    const pending = [1, 2].map((i) => ({
      source: "pdga",
      date: new Date(`2026-03-0${i}`).toISOString(),
      holes: 18,
      computedRating: 940 + i,
      estimated: false,
      payload: { source: "pdga", date: `2026-03-0${i}`, holes: 18, providedRating: 940 + i },
    }));
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    loggedIn();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rounds: [], handicap: null, snapshots: [] }),
    });
    global.fetch = fetchMock;

    const user = userEvent.setup();
    render(<HandicapCalculator />);

    await user.click(await screen.findByRole("button", { name: /Save 2 to my account/i }));

    await waitFor(() => {
      const posts = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/handicap/rounds" && init?.method === "POST"
      );
      expect(posts).toHaveLength(2);
    });

    await waitFor(() => expect(window.localStorage.getItem(PENDING_KEY)).toBeNull());
  });

  test("discarding removes the prompt and clears storage", async () => {
    window.localStorage.setItem(
      PENDING_KEY,
      JSON.stringify([
        {
          source: "pdga",
          date: new Date("2026-03-01").toISOString(),
          holes: 18,
          computedRating: 955,
          estimated: false,
          payload: { source: "pdga", date: "2026-03-01", holes: 18, providedRating: 955 },
        },
      ])
    );
    loggedIn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rounds: [], handicap: null, snapshots: [] }),
    });

    const user = userEvent.setup();
    render(<HandicapCalculator />);

    await user.click(await screen.findByRole("button", { name: /Discard/i }));

    await waitFor(() => expect(window.localStorage.getItem(PENDING_KEY)).toBeNull());
    expect(screen.queryByText(/unsaved round/i)).not.toBeInTheDocument();
  });
});
