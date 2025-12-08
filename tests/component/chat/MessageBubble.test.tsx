import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MessageBubble from "@/components/chat/MessageBubble";
import type { MessageUI } from "@/types/message";

const messageTimestamp = new Date("2023-01-01T12:00:00Z");

const baseMessage: MessageUI = {
  sender: { _id: "user-2", name: "Other" },
  content: "Hello there",
  timestamp: messageTimestamp,
  readBy: [],
};

describe("MessageBubble", () => {
  test("renders system message layout", () => {
    const message: MessageUI = {
      ...baseMessage,
      sender: { _id: "system", name: "System" },
      content: "System notice",
    };

    render(
      <MessageBubble
        msg={message}
        isOwn={false}
        index={0}
        onReportMessage={vi.fn()}
      />
    );

    expect(screen.getByText("Automated Message")).toBeInTheDocument();
    expect(screen.getByText("System notice")).toBeInTheDocument();
  });

  test("shows sender name, content, and flagged banner", () => {
    const message: MessageUI = {
      ...baseMessage,
      flagged: true,
      flaggedCategories: {},
    };

    render(
      <MessageBubble
        msg={message}
        isOwn={false}
        index={1}
        onReportMessage={vi.fn()}
      />
    );

    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(
      screen.getByText(/Message flagged for inappropriate content/i)
    ).toBeInTheDocument();
  });

  test("reports message when icon clicked", async () => {
    const user = userEvent.setup();
    const onReport = vi.fn();

    render(
      <MessageBubble
        msg={baseMessage}
        isOwn={false}
        index={2}
        onReportMessage={onReport}
      />
    );

    await user.click(screen.getByRole("button"));
    expect(onReport).toHaveBeenCalledWith(
      `${messageTimestamp.valueOf()}-2`,
      "user-2"
    );
  });

  test("does not render report icon for own messages", () => {
    render(
      <MessageBubble
        msg={baseMessage}
        isOwn
        index={0}
        onReportMessage={vi.fn()}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });
});

