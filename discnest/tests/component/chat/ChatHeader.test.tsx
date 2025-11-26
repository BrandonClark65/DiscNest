import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ChatHeader from "@/components/chat/ChatHeader";
import type { ThreadUI } from "@/types/thread";

const gradientButtonMock = vi.hoisted(() =>
  vi.fn(({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ))
);

const reportMenuMock = vi.hoisted(() =>
  vi.fn(({ children, onReport }: any) => (
    <div>
      <span>{children}</span>
      <button onClick={onReport}>Report Action</button>
    </div>
  ))
);

vi.mock("@/components/ui/GradientButton", () => ({
  __esModule: true,
  default: gradientButtonMock,
}));

vi.mock("@/components/chat/ReportMenu", () => ({
  __esModule: true,
  default: reportMenuMock,
}));

const baseThread: ThreadUI = {
  _id: "thread-1",
  participants: [
    { _id: "user-1", name: "Me" },
    { _id: "user-2", name: "Other" },
  ],
  listingId: {
    _id: "listing-1",
    title: "Cool Disc",
    imageUrls: [],
  },
  requestId: null,
  messages: [],
  updatedAt: new Date().toISOString(),
};

describe("ChatHeader", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    gradientButtonMock.mockClear();
    reportMenuMock.mockClear();

    const locationMock: Partial<Location> = {
      href: "http://localhost",
    };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: locationMock,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  test("renders listing title and view button", async () => {
    const user = userEvent.setup();
    render(
      <ChatHeader
        thread={baseThread}
        currentUserId="user-1"
        onBack={vi.fn()}
        onReportUser={vi.fn()}
      />
    );

    expect(screen.getByText("Cool Disc")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View Listing" }));
    expect(window.location.href).toBe("/listing/listing-1");
  });

  test("falls back to request title and triggers back/report actions", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onReport = vi.fn();
    const thread: ThreadUI = {
      ...baseThread,
      listingId: null,
      requestId: { _id: "req-1", title: "Need Disk" },
    };

    render(
      <ChatHeader
        thread={thread}
        currentUserId="user-1"
        onBack={onBack}
        onReportUser={onReport}
      />
    );

    await user.click(screen.getByRole("button", { name: "Back to Messages" }));
    expect(onBack).toHaveBeenCalled();

    await user.click(screen.getByText("Report Action"));
    expect(onReport).toHaveBeenCalledWith("user-2");
    expect(screen.getByText("Request: Need Disk")).toBeInTheDocument();
  });

  test("hides report when no other participant", () => {
    const thread: ThreadUI = {
      ...baseThread,
      participants: [{ _id: "user-1", name: "Solo" }],
      listingId: null,
      requestId: null,
    };

    render(
      <ChatHeader
        thread={thread}
        currentUserId="user-1"
        onBack={vi.fn()}
        onReportUser={vi.fn()}
      />
    );

    expect(reportMenuMock).not.toHaveBeenCalled();
    expect(screen.getByText("Conversation")).toBeInTheDocument();
  });
});

