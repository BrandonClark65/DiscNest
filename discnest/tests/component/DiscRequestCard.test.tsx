import { vi, describe, test, expect, beforeEach, afterAll, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DiscRequestCard from "@/components/marketplace/DiscRequestCard";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img data-testid="avatar" {...props} />,
}));

const gradientModule = vi.hoisted(() => ({
  default: vi.fn(
    ({
      label,
      onClick,
      href,
    }: {
      label: string;
      onClick?: () => void;
      href?: string;
    }) =>
      href ? (
        <a href={href} onClick={onClick}>
          {label}
        </a>
      ) : (
        <button onClick={onClick}>{label}</button>
      )
  ),
}));
const gradientButtonMock = gradientModule.default;

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientModule.default,
}));

const baseRequest = {
  _id: "req1",
  title: "Need a Firebird",
  brand: "Innova",
  plastic: "Star",
  weight: 175,
  condition: "Like New",
  description: "Looking for backups",
  userId: { _id: "user-123", name: "Requester" },
};

describe("DiscRequestCard", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    push.mockReset();
    gradientButtonMock.mockClear();
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("navigates to request detail on card click", async () => {
    render(<DiscRequestCard request={baseRequest} currentUserId="viewer" />);

    await userEvent.click(screen.getByText(/Need a Firebird/i));

    expect(push).toHaveBeenCalledWith("/requests/req1");
  });

  test("redirects to login when messaging unauthenticated user", async () => {
    render(<DiscRequestCard request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "Message" }));

    expect(push).toHaveBeenCalledWith("/login");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("sends message and navigates to thread for authenticated user", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ _id: "thread-789" }),
    });

    render(<DiscRequestCard request={baseRequest} currentUserId="viewer" />);

    await userEvent.click(screen.getByRole("button", { name: "Message" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/messages",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    expect(push).toHaveBeenCalledWith("/messages?thread=thread-789");
  });
});

