import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ReportModal from "@/components/modals/ReportModal";

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: toastMock,
  toast: toastMock,
}));

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ))
);

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

const fetchMock = vi.fn();

describe("ReportModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    toastMock.success.mockReset();
    toastMock.error.mockReset();
    onClose.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("does not render when closed", () => {
    const { container } = render(
      <ReportModal reportedUserId="user-1" open={false} onClose={onClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  test("submits report and closes modal", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    render(
      <ReportModal reportedUserId="user-1" open onClose={onClose} />
    );

    const textarea = screen.getByPlaceholderText(/Describe the issue/i);
    await userEvent.type(textarea, "Inappropriate behavior");
    await userEvent.click(screen.getByRole("button", { name: /Submit Report/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/report",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          reportedUserId: "user-1",
          listingId: undefined,
          threadId: undefined,
          requestId: undefined,
          messageId: undefined,
          reason: "Inappropriate behavior",
        }),
      })
    );
    expect(toastMock.success).toHaveBeenCalledWith("Report submitted");
    expect(onClose).toHaveBeenCalled();
  });

  test("shows error toast when submission fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("fail"));

    render(
      <ReportModal reportedUserId="user-1" open onClose={onClose} />
    );

    await userEvent.click(screen.getByRole("button", { name: /Submit Report/i }));

    expect(toastMock.error).toHaveBeenCalledWith("Failed to submit report");
  });
});

