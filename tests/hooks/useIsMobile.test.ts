import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import useIsMobile from "@/hooks/useIsMobile";

describe("useIsMobile", () => {
  const resizeEvent = new Event("resize");

  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();

    // Default width for each test
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });

    // Spy on event listeners
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
  });

  // -------------------------------------------------
  // 1. Initial load behavior
  // -------------------------------------------------
  test("returns false when width is above breakpoint", () => {
    window.innerWidth = 1200;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
    expect(window.addEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
  });

  test("returns true when width is below breakpoint", () => {
    window.innerWidth = 500;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  // -------------------------------------------------
  // 2. Resize handling
  // -------------------------------------------------
  test("updates value when window resizes", () => {
    window.innerWidth = 900;
    const { result } = renderHook(() => useIsMobile(1000));

    expect(result.current).toBe(true); // 900 < 1000

    // Simulate resize to desktop
    act(() => {
      window.innerWidth = 1200;
      window.dispatchEvent(resizeEvent);
    });

    expect(result.current).toBe(false);
  });

  // -------------------------------------------------
  // 3. Cleanup behavior
  // -------------------------------------------------
  test("removes resize listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
  });
});
