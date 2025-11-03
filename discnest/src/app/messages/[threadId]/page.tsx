'use client';

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ThreadDB, ThreadUI } from "@/types/thread";
import type { MessageDB, MessageUI } from "@/types/message";
import GradientButton from "@/components/ui/GradientButton";
import { ArrowBigLeft } from "lucide-react";

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { threadId } = useParams();
  const router = useRouter();

  const [thread, setThread] = useState<ThreadUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Navigation
  const goBack = () => router.push("/messages");

  // --- Mapping helpers ---
  function mapMessageDBtoUI(msg: MessageDB): MessageUI {
    const senderId =
      typeof msg.sender === "string"
        ? msg.sender
        : (msg.sender as any)?._id?.toString?.() || "unknown";
    const senderName =
      typeof msg.sender === "object" && msg.sender && "_id" in msg.sender
        ? (msg.sender as any).name || "Unknown"
        : "Unknown";
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
      messages: thread.messages.map(mapMessageDBtoUI),
      participants: thread.participants.map((p) => {
        if (typeof p === "string") return { _id: p, name: "Unknown" };
        if ("_id" in p) return { _id: p._id.toString(), name: (p as any).name || "Unknown" };
        return { _id: p.toString(), name: "Unknown" };
      }),
      listingId:
        typeof thread.listingId === "object" && "_id" in thread.listingId
          ? {
              _id: thread.listingId._id.toString(),
              title: thread.listingId.title,
              imageUrls: (thread.listingId as any).imageUrls || [],
            }
          : { _id: thread.listingId.toString(), title: "", imageUrls: [] },
      updatedAt:
        thread.updatedAt instanceof Date
          ? thread.updatedAt.toISOString()
          : new Date(thread.updatedAt).toISOString(),
    };
  }

  // --- Fetch thread ---
  async function fetchThread() {
    if (!threadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${threadId}`);
      if (!res.ok) throw new Error("Failed to fetch thread");
      const data: ThreadDB = await res.json();
      setThread(mapThreadDBtoUI(data));
    } catch (err) {
      console.error(err);
      setThread(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  // Mark messages as read
  useEffect(() => {
    if (!threadId || !currentUserId) return;
    async function markRead() {
      try {
        await fetch(`/api/messages/${threadId}`, { method: "PUT" });
        fetchThread();
      } catch (err) {
        console.error("Failed to mark messages as read", err);
      }
    }
    markRead();
  }, [threadId, currentUserId]);

  // Auto-scroll to latest
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  // --- Send message ---
  async function sendMessage() {
    if (!newMessage.trim() || !thread || !currentUserId) return;

    const tempMsg: MessageUI = {
      sender: { _id: currentUserId, name: session?.user?.name || "You" },
      content: newMessage,
      timestamp: new Date(),
      readBy: [currentUserId],
    };

    setThread({ ...thread, messages: [...thread.messages, tempMsg] });
    setNewMessage("");

    try {
      const res = await fetch(`/api/messages/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (!res.ok) console.error("Failed to send message:", await res.text());
      fetchThread();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  // --- States ---
  if (loading)
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70 animate-pulse">
        Loading chat...
      </p>
    );
  if (!thread)
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70">
        Thread not found.
      </p>
    );

  // --- UI ---
  return (
    <div className="relative max-w-3xl mx-auto p-4 sm:p-6 flex flex-col h-[80vh] text-[var(--foreground)]">
      {/* BACK BUTTON */}
      <div className="mb-3">
        <GradientButton
          label="Back to Messages"
          icon={<ArrowBigLeft className="w-5 h-5" />}
          onClick={goBack}
          variant="muted"
          className="px-4 py-2"
        />
      </div>

      {/* HEADER */}
      <h1 className="text-2xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
        {thread.listingId.title || "Conversation"}
      </h1>

      {/* MESSAGES */}
      <div
        className="
          flex-1 overflow-y-auto rounded-2xl border border-[var(--muted)]/30 shadow-sm
          bg-[var(--surface)] p-4 sm:p-5 space-y-3
        "
      >
        {thread.messages.map((msg, i) => {
          const isOwn = msg.sender._id === currentUserId;
          return (
            <div key={i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`
                  max-w-[75%] px-4 py-3 rounded-2xl shadow-sm break-words
                  ${isOwn
                    ? "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-[var(--background)] rounded-br-none"
                    : "bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-bl-none"}
                `}
              >
                <p
                  className={`text-xs font-semibold mb-1 ${
                    isOwn
                      ? "text-[var(--background)]/90 text-right"
                      : "text-[var(--foreground)]/60"
                  }`}
                >
                  {isOwn ? "You" : msg.sender.name}
                </p>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p
                  className={`text-[0.7rem] mt-1 ${
                    isOwn
                      ? "text-[var(--background)]/70 text-right"
                      : "text-[var(--foreground)]/50 text-left"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div
        className="
          mt-4 flex gap-2 items-center
          bg-[var(--surface)] border border-[var(--muted)]/30 rounded-full shadow-sm
          px-3 py-2
        "
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="
            flex-1 bg-transparent text-[var(--foreground)] placeholder-[var(--foreground)]/50
            focus:outline-none text-sm px-2
          "
        />
        <GradientButton
          label="Send"
          onClick={sendMessage}
          variant="primary"
          className="!px-5 !py-2 text-sm"
        />
      </div>
    </div>
  );
}
