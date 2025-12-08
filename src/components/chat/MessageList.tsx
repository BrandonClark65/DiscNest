'use client';

import type { RefObject } from 'react';
import type { ThreadUI } from '@/types/thread';
import MessageBubble from './MessageBubble';

type MessageListProps = {
  thread: ThreadUI;
  currentUserId?: string;
  onReportMessage: (messageId: string, senderId: string) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

export default function MessageList({
  thread,
  currentUserId,
  onReportMessage,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div
      className="
        flex-1 overflow-y-auto rounded-2xl border border-[var(--muted)]/30 shadow-sm
        bg-[var(--surface)] p-4 sm:p-5 space-y-3
      "
    >
      {thread.messages.map((msg, i) => {
        const isOwn = msg.sender._id === currentUserId;
        return (
          <MessageBubble
            key={i}
            msg={msg}
            isOwn={isOwn}
            index={i}
            onReportMessage={onReportMessage}
          />
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
