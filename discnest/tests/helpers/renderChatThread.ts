import { renderHook } from "@testing-library/react";
import useChatThread from "@/hooks/useChatThread";
import { mockSession } from "./mockSession";

export function renderChatThread({
  threadId = "thread123",
  userId = "user1",
  session = mockSession,
} = {}) {
  return renderHook(() => useChatThread(threadId, userId, session));
}
