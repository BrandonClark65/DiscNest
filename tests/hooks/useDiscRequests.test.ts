import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import useDiscRequests from "@/hooks/useDiscRequests";
import { mockGeoSuccess, mockGeoFailure } from "../helpers/mockGeolocation";

const flush = () => act(() => Promise.resolve());

describe("useDiscRequests", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    global.fetch = vi.fn(); // reset fetch for each test
  });

  // -------------------------------------------------
  // 1. Fetch without geolocation
  // -------------------------------------------------
  test("loads requests without geolocation", async () => {
    mockGeoFailure();

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          requests: [{ _id: "1", title: "Test Req", userId: { _id: "u1" } }],
          total: 1,
        }),
    });

    const { result } = renderHook(() => useDiscRequests());

    await flush();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/requests?page=1&limit=10"
    );

    expect(result.current.requests.length).toBe(1);
    expect(result.current.loading).toBe(false);
  });

  // -------------------------------------------------
  // 2. Fetch WITH geolocation
  // -------------------------------------------------
  test("loads requests with geolocation", async () => {
    mockGeoSuccess(50, -120);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          requests: [{ _id: "1", title: "Nearby", userId: { _id: "u1" } }],
          total: 1,
        }),
    });

    const { result } = renderHook(() => useDiscRequests());

    await flush();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/requests?page=1&limit=10&lat=50&lng=-120"
    );

    expect(result.current.requests[0]?.title).toBe("Nearby");
  });

  // -------------------------------------------------
  // 3. Page changes trigger new fetch
  // -------------------------------------------------
  test("fetches again when page changes", async () => {
    mockGeoFailure();

    // Page 1
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ requests: [{ _id: "A" }], total: 20 }),
    });

    const { result } = renderHook(() => useDiscRequests());
    await flush();

    // Page 2
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ requests: [{ _id: "B" }], total: 20 }),
    });

    act(() => result.current.setPage(2));
    await flush();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/requests?page=2&limit=10"
    );
    expect(result.current.requests[0]?._id).toBe("B");
  });

  // -------------------------------------------------
  // 4. Handles fetch error gracefully
  // -------------------------------------------------
  test("handles API errors", async () => {
    mockGeoFailure();

    (global.fetch as any).mockRejectedValueOnce(new Error("fail"));

    const { result } = renderHook(() => useDiscRequests());
    await flush();

    expect(result.current.requests).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
