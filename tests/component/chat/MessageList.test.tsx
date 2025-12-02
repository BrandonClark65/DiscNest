import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";

import MessageList from "@/components/chat/MessageList";
import type { ThreadUI } from "@/types/thread";

const messageBubbleMock = vi.hoisted(() =>
  vi.fn(() => <div data-testid="bubble" />)
);

vi.mock("@/components/chat/MessageBubble", () => ({
  __esModule: true,
  default: messageBubbleMock,
}));

const makeThread = (): ThreadUI => ({
  _id: "thread-1",
  participants: [
    { _id: "user-1", name: "A" },
    { _id: "user-2", name: "B" },
  ],
  listingId: null,
  requestId: null,
  messages: [
    {
      sender: { _id: "user-1", name: "A" },
      content: "Hello",
      timestamp: new Date(),
      readBy: [],
    },
    {
      sender: { _id: "user-2", name: "B" },
      content: "Hi",
      timestamp: new Date(),
      readBy: [],
    },
  ],
  updatedAt: new Date().toISOString(),
});

describe("MessageList", () => {
  test("renders message bubbles and updates end ref", () => {
    const thread = makeThread();
    const ref = createRef<HTMLDivElement>();
    const onReport = vi.fn();

    const { getAllByTestId } = render(
      <MessageList
        thread={thread}
        currentUserId="user-1"
        onReportMessage={onReport}
        messagesEndRef={ref}
      />
    );

    expect(getAllByTestId("bubble")).toHaveLength(2);
    expect(messageBubbleMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ isOwn: true }),
      undefined
    );
    expect(messageBubbleMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ isOwn: false }),
      undefined
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

