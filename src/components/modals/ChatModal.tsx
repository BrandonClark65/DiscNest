'use client';

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import type { ThreadUI } from "@/types/thread";
import type { MessageUI } from "@/types/message";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { useAnalytics } from "@/lib/useAnalytics";

type ChatModalProps = {
  threadId: string;
  onClose: () => void;
};

export default function ChatModal({ threadId, onClose }: ChatModalProps) {
  const [thread, setThread] = useState<ThreadUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { trackEvent } = useAnalytics();

  const { data: session, status } = useSession();
  if (status !== "authenticated" || !session?.user?.id) return null;
  const currentUserId = session.user.id;

  useEffect(() => setMounted(true), []);
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

      const mappedThread: ThreadUI = {
        _id: data._id,
        participants: data.participants.map((p: any) => ({
          _id: p._id,
          name: p.name,
        })),
        listingId: data.listingId
          ? {
              _id: data.listingId._id,
              title: data.listingId.title,
              imageUrls: data.listingId.imageUrls || [],
            }
          : null,
        requestId: data.requestId
          ? {
              _id: data.requestId._id,
              title: data.requestId.title,
            }
          : null,
        messages: data.messages.map((msg: any) => ({
          sender: { _id: msg.sender._id, name: msg.sender.name },
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString(),
          readBy: msg.readBy.map((id: any) => id.toString()),
          flagged: msg.flagged ?? false,
          flaggedCategories: msg.flaggedCategories ?? {},
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

  const userName = session?.user?.name || "You";

  // --- Optimistic UI message ---
  const tempMsg: MessageUI = {
    sender: { _id: currentUserId, name: userName },
    content: newMessage,
    timestamp: new Date(),
    readBy: [],
  };

  const previousThread = thread; // backup before temp message
  setThread({
    ...thread,
    messages: [...(thread.messages ?? []), tempMsg],
  });

  const messageToSend = newMessage;
  setNewMessage("");

  try {
    const res = await fetch(`/api/messages/${thread._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: messageToSend }),
    });

    if (!res.ok) {
      // parse error
      const err = await res.json().catch(() => null);
      const msg =
        err?.error || "Your message could not be sent. Please try again.";

      // revert optimistic UI
      setThread(previousThread);

      // error toast
      const toast = (await import("react-hot-toast")).toast;
      toast.error(msg);

      return;
    }

    // success → reload full thread
    fetchThread();
    
    // Track message sent event
    trackEvent('message_sent', {
      thread_id: thread._id,
      listing_id: thread.listing?._id,
      listing_title: thread.listing?.title,
    });
  } catch (error) {
    console.error("Failed to send message:", error);

    // revert UI on error
    setThread(previousThread);

    const toast = (await import("react-hot-toast")).toast;
    toast.error("Something went wrong sending your message.");
  }
}


  if (loading || !thread || !mounted) return null;

  // ✅ Use a portal so it renders above everything (like the map)
  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Wrapper adjusts for mobile */}
        <motion.div
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col h-[80vh] sm:h-[70vh] sm:max-h-[700px] border border-gray-200 dark:border-gray-700 overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
            <h2 className="text-lg font-semibold truncate">
              {thread.listingId?.title ?? "Chat"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50 dark:bg-gray-800">
            {thread.messages?.map((msg, i) => {
              const isOwn = msg.sender._id === currentUserId;
              return (
                <div
                  key={i}
                  className={`flex ${
                    isOwn ? "justify-end" : "justify-start"
                  } items-end`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                      isOwn
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1 opacity-90">
                      {isOwn ? "You" : msg.sender.name}
                    </p>
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                      {msg.content}
                    </p>
                    {msg.flagged && (
                      <p
                        className={`text-xs mt-1 font-semibold ${
                          isOwn ? "text-red-200 text-right" : "text-red-500 text-left"
                        }`}
                      >
                        ⚠️ Message flagged for inappropriate content
                      </p>
                    )}
                    <p
                      className={`text-[0.7rem] mt-1 ${
                        isOwn
                          ? "text-blue-200 text-right"
                          : "text-gray-400 text-left"
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

          {/* Input */}
          <div className="p-3 border-t flex gap-2 bg-white dark:bg-gray-900">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium hover:opacity-90"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
