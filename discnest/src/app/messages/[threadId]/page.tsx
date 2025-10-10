'use client';

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Thread, Participant } from "@/types/thread";
import type { Message } from "@/types/message";

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { threadId } = useParams();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch thread when the ID changes
  useEffect(() => {
    if (threadId) fetchThread();
  }, [threadId]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  async function fetchThread() {
    try {
      const res = await fetch(`/api/messages/${threadId}`);
      if (!res.ok) throw new Error("Failed to fetch thread");
      const data: Thread = await res.json();
      setThread(data);
    } catch (err) {
      console.error(err);
      setThread(null);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !thread || !currentUserId) return;

    const recipient = thread.participants.find(
      p => p._id !== currentUserId
    );
    if (!recipient) return;

    const tempMsg: Message = {
      sender: { _id: currentUserId, name: session?.user?.name || "You" },
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI update
    setThread({
      ...thread,
      messages: [...thread.messages, tempMsg],
    });
    setNewMessage("");

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient._id,
          listingId: thread.listingId._id,
          content: tempMsg.content,
        }),
      });
      // Sync latest thread after sending
      fetchThread();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  if (loading) return <p>Loading chat...</p>;
  if (!thread) return <p>Thread not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-[80vh]">
      <h1 className="text-2xl font-bold mb-2">{thread.listingId.title}</h1>

      <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 flex flex-col gap-2">
        {thread.messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.sender._id === currentUserId
                ? "bg-blue-100 self-end"
                : "bg-gray-100 self-start"
            }`}
          >
            <p className="text-sm font-semibold">{msg.sender.name}</p>
            <p>{msg.content}</p>
            <p className="text-xs text-gray-400">
              {new Date(msg.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border p-2 rounded"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-3 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}


