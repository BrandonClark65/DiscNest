import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FlaggedMessagesTab from "@/components/admin/FlaggedMessagesTab";

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

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("lucide-react", () => ({
  ShieldAlert: () => <span>🛡️</span>,
  CheckCircle: () => <span>✓</span>,
  XCircle: () => <span>✗</span>,
  Send: () => <span>→</span>,
  Ban: () => <span>🚫</span>,
}));

const mockMessages = [
  {
    _id: "msg-1",
    content: "Inappropriate message",
    sender: { name: "User", email: "user@test.com" },
    threadId: { _id: "thread-1", listingId: { title: "Test Listing" } },
    categories: { spam: true },
  },
];

describe("FlaggedMessagesTab", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => mockMessages,
    });
    gradientButtonMock.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("fetches and displays flagged messages", async () => {
    render(<FlaggedMessagesTab />);

    await waitFor(() => {
      expect(screen.getByText("Inappropriate message")).toBeInTheDocument();
    });
    expect(screen.getByText(/Sender:/)).toBeInTheDocument();
  });

  test("takes action on message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => mockMessages,
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        json: async () => [],
      });
    global.fetch = fetchMock;

    render(<FlaggedMessagesTab />);

    await waitFor(() => {
      expect(screen.getByText("Inappropriate message")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Deliver" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/flagged-messages/msg-1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deliver" }),
        }
      );
    });
  });
});

