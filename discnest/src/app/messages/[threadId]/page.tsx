'use client';

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Thread } from "@/types/thread";
import type { Message } from "@/types/message";

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { threadId } = useParams();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch thread when ID changes
  useEffect(() => {
    if (threadId) fetchThread();
  }, [threadId]);

  // Auto-scroll when messages update
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
      const res = await fetch(`/api/messages/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) {
        console.error("Failed to send message:", await res.text());
        return;
      }

      // Refresh thread to sync with DB
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

      <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 flex flex-col gap-3 bg-gray-50">
        {thread.messages.map((msg, i) => {
          const isOwn = msg.sender._id === currentUserId;
          return (
            <div
              key={i}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                  isOwn
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none border"
                }`}
              >
                <p className="text-sm font-semibold mb-1 opacity-90">
                  {isOwn ? "You" : msg.sender.name}
                </p>
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {msg.content}
                </p>
                <p
                  className={`text-[0.7rem] mt-1 ${
                    isOwn ? "text-blue-200 text-right" : "text-gray-400 text-left"
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



