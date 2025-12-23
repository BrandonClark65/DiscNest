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
const confirmModalMock = vi.fn((props?: any) => props);
const editRequestModalMock = vi.fn((props?: any) => props);

vi.mock("@/components/modals/ReportModal", () => ({
  __esModule: true,
  default: (props: any) => {
    reportModalMock(props);
    return props.open ? <div data-testid="report-open" /> : null;
  },
}));

vi.mock("@/components/modals/ConfirmModal", () => ({
  __esModule: true,
  default: (props: any) => {
    confirmModalMock(props);
    return props.open ? (
      <div data-testid="confirm-modal">
        <button onClick={props.onConfirm} data-testid="confirm-button">
          {props.confirmLabel || "Confirm"}
        </button>
        <button onClick={props.onClose} data-testid="cancel-button">
          {props.cancelLabel || "Cancel"}
        </button>
      </div>
    ) : null;
  },
}));

vi.mock("@/components/modals/EditRequestModal", () => ({
  __esModule: true,
  default: (props: any) => {
    editRequestModalMock(props);
    return props.open ? (
      <div data-testid="edit-modal">
        <button onClick={props.onClose} data-testid="edit-close-button">
          Close
        </button>
      </div>
    ) : null;
  },
}));

const toastMocks = vi.hoisted(() => {
  const fn = vi.fn();
  fn.success = vi.fn();
  fn.error = vi.fn();
  return fn;
});

vi.mock("react-hot-toast", () => ({
  default: toastMocks,
  toast: toastMocks,
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
    confirmModalMock.mockClear();
    editRequestModalMock.mockClear();
    toastMocks.mockClear();
    toastMocks.success.mockClear();
    toastMocks.error.mockClear();
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

  test("shows edit and delete buttons in menu when user is owner", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123", email: "owner@test.com" } },
    });

    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "" }));

    expect(screen.getByText(/Edit Request/i)).toBeInTheDocument();
    expect(screen.getByText(/Delete Request/i)).toBeInTheDocument();
    expect(screen.queryByText(/Report User/i)).not.toBeInTheDocument();
  });

  test("shows report button in menu when user is not owner", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "other-user", email: "other@test.com" } },
    });

    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "" }));

    expect(screen.getByText(/Report User/i)).toBeInTheDocument();
    expect(screen.queryByText(/Delete Request/i)).not.toBeInTheDocument();
  });

  test("opens delete confirmation modal when delete is clicked", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123", email: "owner@test.com" } },
    });

    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "" }));
    await userEvent.click(screen.getByText(/Delete Request/i));

    expect(confirmModalMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        title: "Delete Request",
        variant: "danger",
      })
    );
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
  });

  test("deletes request when confirmed", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123", email: "owner@test.com" } },
    });

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Request deleted successfully" }),
    });

    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "" }));
    await userEvent.click(screen.getByText(/Delete Request/i));

    await waitFor(() => {
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("confirm-button"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/requests/req1",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    expect(push).toHaveBeenCalledWith("/marketplace");
  });

  test("handles delete error gracefully", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123", email: "owner@test.com" } },
    });

    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed to delete" }),
    });

    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "" }));
    await userEvent.click(screen.getByText(/Delete Request/i));

    await waitFor(() => {
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("confirm-button"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(toastMocks.error).toHaveBeenCalledWith("Failed to delete");
    expect(push).not.toHaveBeenCalled();
  });

  test("opens edit modal when edit button is clicked", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123", email: "owner@test.com" } },
    });

    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "" }));
    await userEvent.click(screen.getByText(/Edit Request/i));

    expect(editRequestModalMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
        request: expect.objectContaining({
          _id: "req1",
          title: "Need a Buzzz",
        }),
      })
    );
    expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
  });

  test("refreshes page when edit succeeds", async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });

    useSessionMock.mockReturnValue({
      data: { user: { id: "user-123", email: "owner@test.com" } },
    });

    render(<RequestDetail request={baseRequest} />);

    await userEvent.click(screen.getByRole("button", { name: "" }));
    await userEvent.click(screen.getByText(/Edit Request/i));

    await waitFor(() => {
      expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
    });

    // Simulate onSuccess callback
    const editProps = editRequestModalMock.mock.calls[editRequestModalMock.mock.calls.length - 1][0];
    if (editProps.onSuccess) {
      editProps.onSuccess();
    }

    expect(reloadMock).toHaveBeenCalled();
  });
});

