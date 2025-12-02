import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ChatModal from "@/components/modals/ChatModal";

const useSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("react-dom", () => ({
  createPortal: (node: React.ReactNode) => node,
}));

vi.mock("framer-motion", () => {
  const Component = ({ children }: any) => <div>{children}</div>;
  return {
    motion: {
      div: Component,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

const fetchMock = vi.fn();

const threadResponse = {
  _id: "thread-1",
  participants: [
    { _id: "user-1", name: "User One" },
    { _id: "user-2", name: "User Two" },
  ],
  listingId: { _id: "listing-1", title: "Cool Disc", imageUrls: [] },
  requestId: { _id: "req-1", title: "Need a mid" },
  messages: [
    {
      sender: { _id: "user-2", name: "User Two" },
      content: "Hello there",
      timestamp: new Date().toISOString(),
      readBy: ["user-2"],
      flagged: false,
      flaggedCategories: {},
    },
  ],
  updatedAt: new Date().toISOString(),
};

const makeResponse = (data: any) => ({
  ok: true,
  json: async () => data,
});

describe("ChatModal", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-1", name: "User One" } },
      status: "authenticated",
    });
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders fetched thread", async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(threadResponse));

    render(<ChatModal threadId="thread-1" onClose={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByText("Cool Disc")).toBeInTheDocument()
    );
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  test("sends a message and refetches thread", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(threadResponse))
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce(makeResponse(threadResponse));

    render(<ChatModal threadId="thread-1" onClose={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByText("Cool Disc")).toBeInTheDocument()
    );

    const input = screen.getByPlaceholderText(/Type your message/i);
    await userEvent.type(input, "New message");
    await userEvent.click(screen.getByRole("button", { name: /Send/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/messages/thread-1",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ content: "New message" }),
        })
      )
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

