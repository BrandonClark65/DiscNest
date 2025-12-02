import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MessageSellerButton from "@/components/MessageSellerButton";

const useSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

const chatModalMock = vi.hoisted(() => vi.fn(() => <div>Chat Modal</div>));

vi.mock("@/components/modals/ChatModal", () => ({
  __esModule: true,
  default: chatModalMock,
}));

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(
    ({
      label,
      onClick,
    }: {
      label: string;
      onClick?: () => void;
    }) => <button onClick={onClick}>{label}</button>
  )
);

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
const fetchMock = vi.fn();

describe("MessageSellerButton", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    chatModalMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("alerts when user is not logged in", async () => {
    useSessionMock.mockReturnValue({ data: null });
    const user = userEvent.setup();

    render(<MessageSellerButton sellerId="seller-1" listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Message Seller" }));
    expect(alertMock).toHaveBeenCalledWith("Log in to message seller");
  });

  test("creates thread and shows modal", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-1" } },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ _id: "thread-123" }),
    });
    const user = userEvent.setup();

    render(<MessageSellerButton sellerId="seller-1" listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Message Seller" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          recipientId: "seller-1",
          listingId: "listing-1",
        }),
      })
    );
    expect(chatModalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: "thread-123",
      }),
      undefined
    );
  });
});

