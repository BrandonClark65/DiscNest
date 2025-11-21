"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ThreadDB, ThreadUI } from "@/types/thread";
import type { MessageDB, MessageUI } from "@/types/message";

/* -------------------------------------------------------
   MESSAGE MAPPER — handles system messages + user messages
-------------------------------------------------------- */
function mapMessageDBtoUI(msg: MessageDB): MessageUI {
  const SYSTEM_ID = "000000000000000000000000";

  const rawSender =
    msg.sender === null
      ? null
      : typeof msg.sender === "string"
      ? msg.sender
      : msg.sender._id?.toString();

  const isSystem =
    !rawSender || rawSender === SYSTEM_ID || rawSender === "system";

  if (isSystem) {
    return {
      sender: { _id: "system", name: "Automated Message" },
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      readBy: msg.readBy?.map((id) => id.toString()) || [],
      flagged: msg.flagged,
      flaggedCategories: msg.flaggedCategories,
    };
  }

  // Normal user message
  let senderName = "Unknown";
  if (typeof msg.sender === "object" && msg.sender && "_id" in msg.sender) {
    senderName = (msg.sender as any).name || "Unknown";
  }

  return {
    sender: { _id: rawSender!, name: senderName },
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    readBy: msg.readBy?.map((id) => id.toString()) || [],
    flagged: msg.flagged,
    flaggedCategories: msg.flaggedCategories,
  };
}

/* -------------------------------------------------------
   THREAD MAPPER — handles listingId AND requestId
-------------------------------------------------------- */
function mapThreadDBtoUI(thread: ThreadDB): ThreadUI {
  return {
    _id: thread._id.toString(),

    participants: thread.participants.map((p) =>
      "_id" in p
        ? { _id: p._id.toString(), name: (p as any).name || "Unknown" }
        : { _id: p.toString(), name: "Unknown" }
    ),

    // ---- LISTING ----
    listingId: (() => {
      const l = thread.listingId;
      if (!l) return null;

      if (typeof l === "object" && "_id" in l) {
        return {
          _id: l._id.toString(),
          title: (l as any).title || "Listing",
          imageUrls: (l as any).imageUrls || [],
        };
      }

      return { _id: l.toString(), title: "", imageUrls: [] };
    })(),

    // ---- REQUEST ----
    requestId: (() => {
      const r = thread.requestId;
      if (!r) return null;

      if (typeof r === "object" && "_id" in r) {
        return {
          _id: r._id.toString(),
          title: (r as any).title || "Disc Request",
        };
      }

      return { _id: r.toString(), title: "Disc Request" };
    })(),

    messages: thread.messages.map(mapMessageDBtoUI),
    updatedAt: new Date(thread.updatedAt).toISOString(),
  };
}

/* -------------------------------------------------------
   MAIN PAGE COMPONENT
-------------------------------------------------------- */
export default function MessagesPage() {
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id;

  const [threads, setThreads] = useState<ThreadUI[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---- Fetch Threads ---- */
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const fetchThreads = async () => {
      try {
        const res = await fetch("/api/messages");
        const data: ThreadDB[] = await res.json();

        const uiThreads = data.map(mapThreadDBtoUI);

        const sorted = uiThreads.sort((a, b) => {
          const aLast =
            a.messages?.[a.messages.length - 1]?.timestamp || a.updatedAt;
          const bLast =
            b.messages?.[b.messages.length - 1]?.timestamp || b.updatedAt;
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
    window.addEventListener("focus", fetchThreads);
    return () => window.removeEventListener("focus", fetchThreads);
  }, [currentUserId]);

  /* ---- AUTH / LOADING STATES ---- */
  if (status === "loading") {
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70 animate-pulse">
        Loading...
      </p>
    );
  }

  if (!currentUserId) {
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70">
        Log in to view messages
      </p>
    );
  }

  if (loading) {
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70 animate-pulse">
        Loading threads...
      </p>
    );
  }

  if (!threads.length) {
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70">
        No messages yet.
      </p>
    );
  }

  /* -------------------------------------------------------
     THREAD LIST UI
  -------------------------------------------------------- */
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 text-[var(--foreground)]">
      <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-sm">
        Messages
      </h1>

      <ul className="space-y-3">
        {threads.map((thread) => {
          const otherUser = thread.participants.find(
            (p) => p._id !== currentUserId
          );
          const lastMessage = thread.messages?.[thread.messages.length - 1];
          const hasUnread = thread.messages.some(
            (m) => !m.readBy.includes(currentUserId)
          );

          const label = thread.listingId
            ? `Listing: ${thread.listingId.title}`
            : thread.requestId
            ? `Request: ${thread.requestId.title}`
            : "No attached item";

          return (
            <li
              key={thread._id}
              className={`
                transition-all duration-200 rounded-xl border shadow-sm
                ${
                  hasUnread
                    ? "border-[var(--accent)]/40 bg-[color-mix(in srgb, var(--accent) 8%, var(--surface))]"
                    : "border-[var(--muted)]/40 bg-[var(--surface)] hover:border-[var(--accent)]/30"
                }
              `}
            >
              <Link
                href={`/messages/${thread._id}`}
                className="flex justify-between items-start gap-3 p-4 sm:p-5 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  {/* ---- OTHER USER ---- */}
                  <p className="font-semibold flex items-center gap-2 text-[var(--foreground)]">
                    {otherUser?.name || "Unknown User"}

                    {hasUnread && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--background)] font-semibold">
                        New
                      </span>
                    )}
                  </p>

                  {/* ---- LISTING OR REQUEST ---- */}
                  <p className="text-sm text-[var(--foreground)]/70 line-clamp-1">
                    {label}
                  </p>

                  {/* ---- LAST MESSAGE ---- */}
                  <p className="text-sm text-[var(--foreground)]/80 truncate mt-1">
                    {lastMessage?.content || "No messages yet"}
                  </p>
                </div>

                {/* ---- TIMESTAMP ---- */}
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
