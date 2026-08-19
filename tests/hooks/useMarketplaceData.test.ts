// tests/hooks/useMarketplaceData.test.ts
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useMarketplaceData } from "@/hooks/useMarketplaceData";
import { mockSession } from "../helpers/mockSession";
import { mockGeoSuccess, mockGeoFailure } from "../helpers/mockGeolocation";

// Helper: flush React updates
const flush = () => act(() => Promise.resolve());

// --- Mock next-auth/react ---
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

// Import after mock
import { useSession } from "next-auth/react";

describe("useMarketplaceData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
    mockGeoFailure(); // default: no location
  });

  function setSession(
    sessionObj: any,
    status: "authenticated" | "unauthenticated" | "loading" = "authenticated"
  ) {
    (useSession as Mock).mockReturnValue({
      data: sessionObj,
      status,
    });
  }

  // -------------------------------------------------------------
  // 1. Market tab loads marketplace listings
  // -------------------------------------------------------------
  test("loads marketplace listings when activeTab=market", async () => {
    setSession(mockSession());

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          listings: [
            {
              _id: "L1",
              title: "Test Listing",
              location: { coordinates: [0, 0] },
              userId: { _id: "u999" },
            },
          ],
          totalCount: 1,
        }),
    });

    const { result } = renderHook(() => useMarketplaceData());
    await flush();

    // UPDATED EXPECTATION - excludeUserId=user1 is always added
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/listings?mode=marketplace&page=1&limit=20&excludeUserId=user1"
    );

    expect(result.current.listingsToShow.length).toBe(1);
  });

  // -------------------------------------------------------------
  // 2. If session status=loading, do not fetch yet
  // -------------------------------------------------------------
  test("does not fetch marketplace when session status=loading", async () => {
    setSession(null, "loading");

    renderHook(() => useMarketplaceData());
    await flush();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------
  // 3. My listings only load when activeTab=myListings
  // -------------------------------------------------------------
  test("loads myListings only when activeTab=myListings", async () => {
    setSession(mockSession());

    // Initial marketplace call
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ listings: [], totalCount: 0 }),
    });

    const { result } = renderHook(() => useMarketplaceData());
    await flush();

    // Now switch tab
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          listings: [
            {
              _id: "M1",
              title: "My Listing",
              location: { coordinates: [0, 0] },
              userId: { _id: "user1" },
            },
          ],
          totalCount: 1,
        }),
    });

    act(() => result.current.setActiveTab("myListings"));
    await flush();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/listings?mode=myListings&page=1&limit=100&userId=user1"
    );

    expect(result.current.listingsToShow[0]._id).toBe("M1");
  });

  // -------------------------------------------------------------
  // 4. Changing filters resets marketplace page to 1
  // -------------------------------------------------------------
  test("search/brand/condition reset page=1", async () => {
    setSession(mockSession());

    // initial marketplace fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ listings: [], totalCount: 0 }),
    });

    const { result } = renderHook(() => useMarketplaceData());
    await flush();

    act(() => result.current.setMarketPage(3));
    await flush();

    expect(result.current.marketPage).toBe(3);

    // trigger reset
    act(() => result.current.setSearchQuery("buzz"));
    await flush();

    expect(result.current.marketPage).toBe(1);
  });

  // -------------------------------------------------------------
  // 5. userLocation included in marketplace fetch
  // -------------------------------------------------------------
  test("includes userLocation in marketplace fetch", async () => {
    setSession(mockSession());
    mockGeoSuccess(33, -118);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ listings: [], totalCount: 0 }),
    });

    renderHook(() => useMarketplaceData());
    await flush();

    // UPDATED EXPECTATION - excludeUserId=user1 appended
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/listings?mode=marketplace&page=1&limit=20&lat=33&lng=-118&excludeUserId=user1"
    );
  });
});
