import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import DiscBagDisplay from "@/components/DiscbagDisplay";
import type { Disc } from "@/types/disc";

const useSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  getSession: vi.fn(),
}));

const fetchMock = vi.fn();

const mockBag: Disc[] = [
  { _id: "1", name: "Aviar", color: "#ff0000" },
  { _id: "2", name: "Buzzz", color: "#00ff00" },
] as Disc[];

describe("DiscBagDisplay", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ bag: mockBag }),
    });
    (global as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (global as any).ResizeObserver;
  });

  test("renders controlled bag when prop provided", () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "user@test.com" } },
    });

    const { container } = render(<DiscBagDisplay bag={mockBag} />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  test("shows login prompt when user not logged in", () => {
    useSessionMock.mockReturnValue({ data: null });

    render(<DiscBagDisplay bag={[]} />);

    expect(screen.getByText(/Log in to fill your bag/i)).toBeInTheDocument();
  });

  test("fetches bag discs when session available", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "user@test.com" } },
    });

    render(<DiscBagDisplay />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/discs/bag?email=user%40test.com"
      )
    );
  });
});

