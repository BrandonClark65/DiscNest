// tests/hooks/useChatThread.test.ts

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import useChatThread from "@/hooks/useChatThread";
import { makeThreadDB, makeMessageDB } from "../helpers/mockThread";

// -------------------------------
// GLOBAL MOCKS
// -------------------------------

// Mock toast BEFORE the hook loads
vi.mock("react-hot-toast", () => ({
  toast: { error: vi.fn() },
}));

// Mock messageMapping so we don't test mapping logic here
vi.mock("@/lib/messageMapping", () => ({
  mapThreadDBtoUI: (db: any) => db,
}));

// Utility: flush React state updates
const flush = () => act(() => Promise.resolve());

describe("useChatThread", () => {
  beforeEach(() => {
    cleanup();            // 🔥 critical: unmount previous hook & stop old effects
    vi.restoreAllMocks(); // reset mocks
    global.fetch = vi.fn(); // fresh fetch mock for every test
  });

  // ---------------------------------------------------
  // TEST: initial fetch loads thread
  // ---------------------------------------------------
  test("initial fetch loads thread data", async () => {
    const threadDB = makeThreadDB();

    (global.fetch as any)
      // initial GET
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(threadDB),
      })
      // PUT mark read
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      // GET re-fetch after mark read
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(threadDB),
      });

    const { result } = renderHook(() =>
      useChatThread("thread123", "user1", {
        user: { name: "User One" },
      } as any)
    );

    await flush();

    expect(result.current.thread?._id).toBe("thread123");
    expect(result.current.loading).toBe(false);
  });

  // ---------------------------------------------------
  // TEST: no threadId → no fetch calls
  // ---------------------------------------------------
  test("does nothing when threadId is missing", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const { result } = renderHook(() =>
      useChatThread(undefined, "user1", null)
    );

    await flush();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.thread).toBe(null);
  });

  // ---------------------------------------------------
  // TEST: PUT mark-read is triggered
  // ---------------------------------------------------
  test("marks thread as read and refetches", async () => {
    const threadDB = makeThreadDB();

    (global.fetch as any)
      // initial GET
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(threadDB),
      })
      // PUT mark read
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      // GET re-fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(threadDB),
      });

    renderHook(() =>
      useChatThread("thread123", "user1", {
        user: { name: "User One" },
      } as any)
    );

    await flush();

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/messages/thread123",
      expect.objectContaining({ method: "PUT" })
    );
  });

  // ---------------------------------------------------
  // TEST: optimistic update
  // ---------------------------------------------------
  test("optimistic update when sending message", async () => {
    const emptyThread = makeThreadDB({ messages: [] });

    (global.fetch as any)
      // initial load
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyThread),
      })
      // PUT mark read
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      // refetch after PUT
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyThread),
      })
      // POST send
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      // final GET
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            makeThreadDB({
              messages: [makeMessageDB({ content: "from server" })],
            })
          ),
      });

    const { result } = renderHook(() =>
      useChatThread("thread123", "user1", {
        user: { name: "User One" },
      } as any)
    );

    await flush();

    act(() => result.current.setNewMessage("optimistic"));
    await act(() => result.current.sendMessage());

    expect(result.current.thread?.messages.length).toBe(1);
  });

  // ---------------------------------------------------
  // TEST: rollback optimistic update on failed send
  // ---------------------------------------------------
  test("rollback optimistic update on failed send", async () => {
    const emptyThread = makeThreadDB({ messages: [] });

    const toastMod = await import("react-hot-toast");
    const toastError = toastMod.toast.error;

    (global.fetch as any)
      // initial load
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyThread),
      })
      // PUT mark read
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      // refetch after mark read
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyThread),
      })
      // POST fails
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Bad request" }),
      });

    const { result } = renderHook(() =>
      useChatThread("thread123", "user1", {
        user: { name: "User One" },
      } as any)
    );

    await flush();

    act(() => result.current.setNewMessage("fail test"));
    await act(() => result.current.sendMessage());

    await flush();

    expect(result.current.thread?.messages.length).toBe(0);
    expect(toastError).toHaveBeenCalled();
  });
});
