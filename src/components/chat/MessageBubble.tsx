'use client';

import { MoreVertical } from 'lucide-react';
import type { MessageUI } from '@/types/message';

type MessageBubbleProps = {
  msg: MessageUI;
  isOwn: boolean;
  index: number;
  threadId: string;
  onReportMessage: (messageId: string, senderId: string) => void;
};

export default function MessageBubble({
  msg,
  isOwn,
  index,
  threadId,
  onReportMessage,
}: MessageBubbleProps) {
  const isSystem = msg.sender._id === "system";

  // --- SYSTEM MESSAGE BUBBLE ---
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="
          bg-[var(--muted)]/20 
          text-[var(--foreground)]/70 
          px-4 py-2 
          rounded-xl 
          text-sm 
          max-w-[80%] 
          text-center 
          shadow-sm
        ">
          <p className="font-semibold text-xs mb-1">Automated Message</p>
          <p>{msg.content}</p>
          <p className="text-[0.7rem] mt-1 text-[var(--foreground)]/50">
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  }

  // --- NORMAL USER MESSAGE BUBBLE ---
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          relative max-w-[75%] px-4 py-3 rounded-2xl shadow-sm break-words
          ${
            isOwn
              ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-[var(--background)] rounded-br-none'
              : 'bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-bl-none'
          }
        `}
      >
        <p
          className={`text-xs font-semibold mb-1 ${
            isOwn
              ? 'text-[var(--background)]/90 text-right'
              : 'text-[var(--foreground)]/60'
          }`}
        >
          {isOwn ? 'You' : msg.sender.name}
        </p>

        <p className="text-sm leading-relaxed">{msg.content}</p>

        {msg.flagged && (
          <p
            className={`text-xs mt-1 font-semibold ${
              isOwn ? 'text-red-300 text-right' : 'text-red-500 text-left'
            }`}
          >
            ⚠️ Message flagged for inappropriate content
          </p>
        )}

        <p
          className={`text-[0.7rem] mt-1 ${
            isOwn
              ? 'text-[var(--background)]/70 text-right'
              : 'text-[var(--foreground)]/50 text-left'
          }`}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* No report button for own messages or system messages */}
        {!isOwn && (
          <button
            onClick={() =>
              onReportMessage(
                `${msg.timestamp.valueOf()}-${index}`,
                msg.sender._id
              )
            }
            className="absolute top-2 right-2 text-[var(--foreground)]/40 hover:text-red-500"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
