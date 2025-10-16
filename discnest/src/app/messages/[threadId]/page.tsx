'use client';

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // <-- added useRouter
import type { ThreadDB, ThreadUI } from "@/types/thread";
import type { MessageDB, MessageUI } from "@/types/message";

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { threadId } = useParams();
  const router = useRouter(); // <-- added router
  const [thread, setThread] = useState<ThreadUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Back button handler
  const goBack = () => {
    router.push("/messages"); // Adjust to your messages page route
  };

  // Convert DB message → UI message
  function mapMessageDBtoUI(msg: MessageDB): MessageUI {
    let senderId: string;
    let senderName: string;

    if (typeof msg.sender === "string") {
      senderId = msg.sender;
      senderName = "Unknown";
    } else if (
      typeof msg.sender === "object" &&
      msg.sender !== null &&
      "_id" in msg.sender
    ) {
      senderId = (msg.sender._id as any).toString();
      senderName = (msg.sender as any).name || "Unknown";
    } else {
      senderId = (msg.sender as any)?.toString?.() || "unknown";
      senderName = "Unknown";
    }

    return {
      sender: { _id: senderId, name: senderName },
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      readBy: msg.readBy.map((id) => id.toString()),
    };
  }

  // Convert DB thread → UI thread
  function mapThreadDBtoUI(thread: ThreadDB): ThreadUI {
    const updatedAt =
      thread.updatedAt instanceof Date
        ? thread.updatedAt.toISOString()
        : new Date(thread.updatedAt).toISOString();

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
      updatedAt,
    };
  }

  // Fetch thread
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  // Send message
  async function sendMessage() {
    if (!newMessage.trim() || !thread || !currentUserId) return;

    const tempMsg: MessageUI = {
      sender: { _id: currentUserId, name: session?.user?.name || "You" },
      content: newMessage,
      timestamp: new Date(),
      readBy: [currentUserId],
    };

    // Optimistic UI
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

  if (loading) return <p>Loading chat...</p>;
  if (!thread) return <p>Thread not found.</p>;

  return (
    <div className="relative max-w-3xl mx-auto p-4 flex flex-col h-[80vh]">
      {/* Back Button above the chat */}
      <div className="mb-2">
        <button
          onClick={goBack}
          className="
            px-4 py-2 bg-blue-500 text-white rounded-full
            shadow hover:bg-blue-600 transition-colors
          "
        >
          ← Back
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-2">{thread.listingId.title}</h1>

      <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 flex flex-col gap-3 bg-gray-50">
        {thread.messages.map((msg, i) => {
          const isOwn = msg.sender._id === currentUserId;
          return (
            <div key={i} className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end`}>
              <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${isOwn ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-900 rounded-bl-none border"}`}>
                <p className="text-sm font-semibold mb-1 opacity-90">{isOwn ? "You" : msg.sender.name}</p>
                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                <p className={`text-[0.7rem] mt-1 ${isOwn ? "text-blue-200 text-right" : "text-gray-400 text-left"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
        <button onClick={sendMessage} className="bg-blue-600 text-white px-3 rounded">Send</button>
      </div>
    </div>
  );
}
