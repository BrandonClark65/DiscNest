'use client';

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import type { ThreadUI} from "@/types/thread"; 
import type { MessageUI } from "@/types/message";

type ChatModalProps = {
  threadId: string;
  onClose: () => void;
};

export default function ChatModal({ threadId, onClose }: ChatModalProps) {
  const [thread, setThread] = useState<ThreadUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: session, status } = useSession();
  

  if (status !== "authenticated" || !session?.user?.id) return null;
  const currentUserId = session?.user?.id;

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  async function fetchThread() {
    try {
      const res = await fetch(`/api/messages/${threadId}`);
      const data = await res.json();

      // Map backend messages to UI-friendly messages
      const mappedThread: ThreadUI = {
        _id: data._id,
        participants: data.participants.map((p: any) => ({ _id: p._id, name: p.name })),
        listingId: {
          _id: data.listingId._id,
          title: data.listingId.title,
          imageUrls: data.listingId.imageUrls || [],
        },
        messages: data.messages.map((msg: any) => ({
          sender: { _id: msg.sender._id, name: msg.sender.name },
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString(),
          readBy: msg.readBy.map((id: any) => id.toString()),
        })),
        updatedAt: new Date(data.updatedAt).toISOString(),
      };

      setThread(mappedThread);
    } catch (error) {
      console.error("Failed to fetch thread:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !thread) return;

    const tempMsg: MessageUI = {
      sender: { _id: currentUserId, name: "You" },
      content: newMessage,
      timestamp: new Date(),
      readBy: [],
    };

    // Optimistic UI
    setThread({ ...thread, messages: [...(thread.messages ?? []), tempMsg] });
    setNewMessage("");

    try {
      await fetch(`/api/messages/${thread._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      fetchThread(); // refresh from backend
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  if (loading || !thread) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{thread.listingId?.title ?? "No Title"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
          {thread.messages?.map((msg, i) => {
            const isOwn = msg.sender._id === currentUserId;
            return (
              <div key={i} className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end`}>
                <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                  isOwn
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none border"
                }`}>
                  <p className="text-sm font-semibold mb-1 opacity-90">
                    {isOwn ? "You" : msg.sender.name}
                  </p>
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
