'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { DiscNestUser as User } from "@/types/user";
import type { Message } from "@/types/message";
import type { Thread } from "@/types/thread";


export default function ChatPage() {
  const { threadId } = useParams();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");

  async function fetchThread() {
    const res = await fetch(`/api/messages/${threadId}`);
    const data = await res.json();
    setThread(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  async function sendMessage() {
    if (!newMessage.trim() || !thread) return;
    const recipientId = thread.participants.find(p => p._id !== thread.participants[0]._id)?._id; // assuming first is current user
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId,
        listingId: thread.listingId._id,
        content: newMessage,
      }),
    });
    setNewMessage("");
    fetchThread(); // refresh messages
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
              msg.sender._id === thread.participants[0]._id ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
            }`}
          >
            <p className="text-sm"><strong>{msg.sender.name}</strong></p>
            <p>{msg.content}</p>
            <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</p>
          </div>
        ))}
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
        <button onClick={sendMessage} className="bg-blue-600 text-white px-3 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
