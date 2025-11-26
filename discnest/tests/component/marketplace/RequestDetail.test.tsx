import { vi, describe, test, expect, beforeEach, afterAll, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RequestDetail from "@/components/marketplace/RequestDetail";

const push = vi.fn();
const sessionMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));
const useSessionMock = sessionMocks.useSession;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
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

const reportModalMock = vi.fn((props?: any) => props);

vi.mock("@/components/modals/ReportModal", () => ({
  __esModule: true,
  default: (props: any) => {
    reportModalMock(props);
    return props.open ? <div data-testid="report-open" /> : null;
  },
}));

const baseRequest = {
  _id: "req1",
  title: "Need a Buzzz",
  brand: "Discraft",
  plastic: "ESP",
  weight: 177,
  condition: "Like New",
  description: "Looking for backups",
  userId: { _id: "user-123", name: "Requester", avatarUrl: "/img.png" },
  location: { coordinates: [-118, 33] },
};

describe("RequestDetail", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    push.mockReset();
    gradientButtonMock.mockClear();
    reportModalMock.mockClear();
    global.fetch = vi.fn();
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({ data: null });
    Object.defineProperty(global.navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("prompts login when messaging while signed out", async () => {
    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "Message Requester" }));

    expect(push).toHaveBeenCalledWith("/login");
  });

  test("sends message when authenticated", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "viewer", email: "viewer@test.com" } },
    });
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ _id: "thread-123" }),
    });

    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "Message Requester" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/messages",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(push).toHaveBeenCalledWith("/messages?thread=thread-123");
  });

  test("opens report modal from menu", async () => {
    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "" }));
    await userEvent.click(screen.getByText(/Report User/i));

    expect(reportModalMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true })
    );
    expect(screen.getByTestId("report-open")).toBeInTheDocument();
  });
});

