'use client';

import { useEffect, useState, useRef } from "react";
import type { Thread } from "@/types/thread";

type ChatModalProps = {
  threadId: string;
  onClose: () => void;
};

export default function ChatModal({ threadId, onClose }: ChatModalProps) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch thread on mount or threadId change
  useEffect(() => {
    fetchThread();
  }, [threadId]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  async function fetchThread() {
    try {
      const res = await fetch(`/api/messages/${threadId}`);
      const data = await res.json();
      setThread(data);
    } catch (error) {
      console.error("Failed to fetch thread:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !thread) return;

    const sender = thread.participants?.[0];
    const recipient = thread.participants?.[1];
    const listingId = thread.listingId?._id;

    if (!sender || !recipient || !listingId) {
      console.warn("Cannot send message: missing sender, recipient, or listingId");
      return;
    }

    const tempMsg = {
      sender,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update UI
    setThread({ ...thread, messages: [...(thread.messages ?? []), tempMsg] });
    setNewMessage("");

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient._id,
          listingId,
          content: newMessage,
        }),
      });
      fetchThread(); // Refresh thread after sending
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  if (loading || !thread) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{thread.listingId?.title ?? "No Title"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {thread.messages?.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded max-w-[80%] ${
                msg.sender._id === thread.participants?.[0]?._id
                  ? "bg-blue-100 self-end"
                  : "bg-gray-100 self-start"
              }`}
            >
              <p className="text-sm font-medium">{msg.sender.name}</p>
              <p>{msg.content}</p>
              <p className="text-xs text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
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
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

