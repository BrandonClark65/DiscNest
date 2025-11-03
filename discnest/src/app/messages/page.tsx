'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ThreadDB, ThreadUI } from "@/types/thread";
import type { MessageDB, MessageUI } from "@/types/message";

// --- Helpers ---
function mapMessageDBtoUI(msg: MessageDB): MessageUI {
  let senderId = "";
  let senderName = "Unknown";

  if (typeof msg.sender === "string") {
    senderId = msg.sender;
  } else if ("_id" in msg.sender) {
    senderId = msg.sender._id.toString();
    senderName = (msg.sender as any).name || "Unknown";
  }
  return {
    sender: { _id: senderId, name: senderName },
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    readBy: msg.readBy.map((id) => id.toString()),
  };
}

function mapThreadDBtoUI(thread: ThreadDB): ThreadUI {
  return {
    _id: thread._id.toString(),
    participants: thread.participants.map((p) =>
      "_id" in p
        ? { _id: p._id.toString(), name: (p as any).name || "Unknown" }
        : { _id: p.toString(), name: "Unknown" }
    ),
    listingId:
      typeof thread.listingId === "object" && "_id" in thread.listingId
        ? {
            _id: thread.listingId._id.toString(),
            title: thread.listingId.title,
            imageUrls: (thread.listingId as any).imageUrls || [],
          }
        : { _id: thread.listingId.toString(), title: "", imageUrls: [] },
    messages: thread.messages.map(mapMessageDBtoUI),
    updatedAt: new Date(thread.updatedAt).toISOString(),
  };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [threads, setThreads] = useState<ThreadUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const fetchThreads = async () => {
      try {
        const res = await fetch("/api/messages");
        const data: ThreadDB[] = await res.json();
        const threadsUI = data.map(mapThreadDBtoUI);

        const sorted = threadsUI.sort((a, b) => {
          const aLast = a.messages?.[a.messages.length - 1]?.timestamp || a.updatedAt;
          const bLast = b.messages?.[b.messages.length - 1]?.timestamp || b.updatedAt;
          return new Date(bLast).getTime() - new Date(aLast).getTime();
        });

        setThreads(sorted);
      } catch (err) {
        console.error("❌ Error fetching threads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
    const handleFocus = () => fetchThreads();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [currentUserId]);

  // --- States ---
  if (!currentUserId)
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70">
        Log in to view messages
      </p>
    );
  if (loading)
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70 animate-pulse">
        Loading threads...
      </p>
    );
  if (!threads.length)
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70">
        No messages yet.
      </p>
    );

  // --- UI ---
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 text-[var(--foreground)]">
      <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-sm">
        Messages
      </h1>

      <ul className="space-y-3">
        {threads.map((thread) => {
          const otherUser = thread.participants.find((p) => p._id !== currentUserId);
          const lastMessage = thread.messages?.[thread.messages.length - 1];
          const hasUnread = currentUserId
            ? thread.messages?.some((m) => !(m.readBy || []).includes(currentUserId))
            : false;

          return (
            <li
              key={thread._id}
              className={`
                transition-all duration-200 rounded-xl border shadow-sm
                ${hasUnread
                  ? 'border-[var(--accent)]/40 bg-[color-mix(in srgb, var(--accent) 8%, var(--surface))]'
                  : 'border-[var(--muted)]/40 bg-[var(--surface)] hover:border-[var(--accent)]/30'}
              `}
            >
              <Link
                href={`/messages/${thread._id}`}
                className="flex justify-between items-start gap-3 p-4 sm:p-5 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold flex items-center gap-2 text-[var(--foreground)]">
                    {otherUser?.name || "Unknown User"}
                    {hasUnread && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--background)] font-semibold">
                        New
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[var(--foreground)]/70 line-clamp-1">
                    {thread.listingId?.title || "No listing"}
                  </p>
                  <p className="text-sm text-[var(--foreground)]/80 truncate mt-1">
                    {lastMessage?.content || "No messages yet"}
                  </p>
                </div>

                <div className="text-xs text-[var(--foreground)]/50 whitespace-nowrap">
                  {new Date(
                    lastMessage?.timestamp || thread.updatedAt
                  ).toLocaleString()}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
