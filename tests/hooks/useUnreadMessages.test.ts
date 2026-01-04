import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useSession } from "next-auth/react";
import useUnreadMessages from "@/hooks/useUnreadMessages";
import { makeThreadDB, makeMessageDB } from "../helpers/mockThread";

// Mock next-auth/react
vi.mock("next-auth/react");

// Utility: flush React state updates
const flush = () => act(() => Promise.resolve());

describe("useUnreadMessages", () => {
  const mockUseSession = vi.mocked(useSession);

  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
    global.fetch = vi.fn();
    
    // Mock window.addEventListener/removeEventListener for focus events
    const listeners: Record<string, Function[]> = {};
    global.window.addEventListener = vi.fn((event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    });
    global.window.removeEventListener = vi.fn((event: string, handler: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------
  // TEST: returns false when user is not authenticated
  // ---------------------------------------------------
  test("returns false when user is not authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as any);

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // TEST: returns false when session has no user
  // ---------------------------------------------------
  test("returns false when session has no user", async () => {
    mockUseSession.mockReturnValue({
      data: { user: null },
      status: "authenticated",
    } as any);

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // TEST: returns false when there are no unread messages
  // ---------------------------------------------------
  test("returns false when there are no unread messages", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    const thread = makeThreadDB({
      messages: [
        makeMessageDB({
          sender: { _id: "user2", name: "User Two" },
          readBy: ["user1", "user2"], // user1 has read it
        }),
      ],
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([thread]),
    });

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith("/api/messages");
  });

  // ---------------------------------------------------
  // TEST: returns true when there are unread messages
  // ---------------------------------------------------
  test("returns true when there are unread messages", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    const thread = makeThreadDB({
      messages: [
        makeMessageDB({
          sender: { _id: "user2", name: "User Two" },
          readBy: ["user2"], // user1 has NOT read it
        }),
      ],
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([thread]),
    });

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(true);
  });

  // ---------------------------------------------------
  // TEST: ignores messages sent by the current user
  // ---------------------------------------------------
  test("ignores messages sent by the current user", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    const thread = makeThreadDB({
      messages: [
        makeMessageDB({
          sender: { _id: "user1", name: "User One" }, // sent by current user
          readBy: [], // not read, but should be ignored
        }),
      ],
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([thread]),
    });

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(false);
  });

  // ---------------------------------------------------
  // TEST: handles threads with no messages
  // ---------------------------------------------------
  test("handles threads with no messages", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    const thread = makeThreadDB({
      messages: [],
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([thread]),
    });

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(false);
  });

  // ---------------------------------------------------
  // TEST: handles multiple threads with mixed read/unread
  // ---------------------------------------------------
  test("returns true if any thread has unread messages", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    const threads = [
      makeThreadDB({
        _id: "thread1",
        messages: [
          makeMessageDB({
            sender: { _id: "user2", name: "User Two" },
            readBy: ["user1"], // read
          }),
        ],
      }),
      makeThreadDB({
        _id: "thread2",
        messages: [
          makeMessageDB({
            sender: { _id: "user3", name: "User Three" },
            readBy: [], // unread - should return true
          }),
        ],
      }),
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(threads),
    });

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(true);
  });

  // ---------------------------------------------------
  // TEST: handles API errors gracefully
  // ---------------------------------------------------
  test("handles API errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    (global.fetch as any).mockRejectedValueOnce(new Error("API error"));

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to check unread messages:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  // ---------------------------------------------------
  // TEST: handles non-ok API responses
  // ---------------------------------------------------
  test("handles non-ok API responses", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(false);
  });

  // ---------------------------------------------------
  // TEST: polls for unread messages every 30 seconds
  // ---------------------------------------------------
  test("polls for unread messages every 30 seconds", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    const thread = makeThreadDB({
      messages: [
        makeMessageDB({
          sender: { _id: "user2", name: "User Two" },
          readBy: ["user2"], // unread
        }),
      ],
    });

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([thread]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([thread]),
      });

    renderHook(() => useUnreadMessages());

    await flush();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Advance time by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await flush();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------
  // TEST: checks messages when window regains focus
  // ---------------------------------------------------
  test("checks messages when window regains focus", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    const thread = makeThreadDB({
      messages: [
        makeMessageDB({
          sender: { _id: "user2", name: "User Two" },
          readBy: ["user2"],
        }),
      ],
    });

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([thread]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([thread]),
      });

    renderHook(() => useUnreadMessages());

    await flush();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Get the focus event listener
    const addEventListenerCalls = (global.window.addEventListener as any).mock.calls;
    const focusHandler = addEventListenerCalls.find(
      (call: any[]) => call[0] === "focus"
    )?.[1];

    expect(focusHandler).toBeDefined();

    // Simulate window focus
    act(() => {
      focusHandler();
    });

    await flush();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------
  // TEST: handles string and ObjectId sender formats
  // ---------------------------------------------------
  test("handles different sender ID formats", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    const thread = makeThreadDB({
      messages: [
        makeMessageDB({
          sender: "user2", // string ID
          readBy: [],
        }),
      ],
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([thread]),
    });

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(true);
  });

  // ---------------------------------------------------
  // TEST: handles different readBy ID formats
  // ---------------------------------------------------
  test("handles different readBy ID formats", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "user1" },
      },
      status: "authenticated",
    } as any);

    // Mock ObjectId-like object in readBy
    const mockObjectId = { toString: () => "user1" };

    const thread = makeThreadDB({
      messages: [
        makeMessageDB({
          sender: { _id: "user2", name: "User Two" },
          readBy: [mockObjectId as any], // ObjectId-like
        }),
      ],
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([thread]),
    });

    const { result } = renderHook(() => useUnreadMessages());

    await flush();

    expect(result.current).toBe(false); // Should be read
  });
});
