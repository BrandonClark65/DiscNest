'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Session } from 'next-auth';
import type { ThreadDB, ThreadUI } from '@/types/thread';
import type { MessageDB, MessageUI } from '@/types/message';

export default function useChatThread(
  threadId: string | undefined,
  currentUserId: string | undefined,
  session: Session | null
): {
  thread: ThreadUI | null;
  loading: boolean;
  newMessage: string;
  setNewMessage: (val: string) => void;
  sendMessage: () => Promise<void>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
} {
  const [thread, setThread] = useState<ThreadUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- Mapping helpers (copied from original) ---
  function mapMessageDBtoUI(msg: MessageDB): MessageUI {
  const SYSTEM_IDS = [
    null,
    undefined,
    "",
    "unknown",
    "system",
    "000000000000000000000000", // your fake system ObjectId
  ];

  // Extract raw sender ID as a string
  const rawSender =
    msg.sender === null
      ? null
      : typeof msg.sender === "string"
      ? msg.sender
      : msg.sender._id?.toString() ?? null;

  // Identify system message
  const isSystem = SYSTEM_IDS.includes(rawSender as any);

  if (isSystem) {
    return {
      sender: { _id: "system", name: "Automated Message" },
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      readBy: msg.readBy?.map((id) => id.toString()) || [],
      flagged: msg.flagged ?? false,
      flaggedCategories: msg.flaggedCategories ?? {},
    };
  }

  // Normal user message
  const senderName =
    typeof msg.sender === "object" && msg.sender && "_id" in msg.sender
      ? (msg.sender as any).name || "Unknown"
      : "Unknown";

  return {
    sender: { _id: rawSender!, name: senderName },
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    readBy: msg.readBy?.map((id) => id.toString()) || [],
    flagged: msg.flagged ?? false,
    flaggedCategories: msg.flaggedCategories ?? {},
  };
}


  function mapThreadDBtoUI(t: ThreadDB): ThreadUI {
  return {
    _id: t._id.toString(),

    messages: t.messages.map(mapMessageDBtoUI),

    participants: t.participants.map((p) => {
      if (typeof p === "string") return { _id: p, name: "Unknown" };
      if ("_id" in p)
        return { _id: p._id.toString(), name: (p as any).name || "Unknown" };
      return { _id: p.toString(), name: "Unknown" };
    }),

    // ----------------------------------------
    // LISTING (same as before)
    // ----------------------------------------
    listingId: (() => {
      const l = t.listingId;

      if (!l) {
        return {
          _id: "unknown",
          title: "Listing Unavailable",
          imageUrls: [],
        };
      }

      if (typeof l === "object" && "_id" in l) {
        return {
          _id: l._id.toString(),
          title: (l as any).title || "Listing",
          imageUrls: (l as any).imageUrls || [],
        };
      }

      return {
        _id: l.toString(),
        title: "",
        imageUrls: [],
      };
    })(),

    // ----------------------------------------
    // REQUEST (🆕 THIS WAS MISSING)
    // ----------------------------------------
    requestId: (() => {
      const r = t.requestId;

      if (!r) return null;

      if (typeof r === "object" && "_id" in r) {
        return {
          _id: r._id.toString(),
          title: (r as any).title || "Disc Request",
        };
      }

      return { _id: r.toString(), title: "Disc Request" };
    })(),

    updatedAt:
      t.updatedAt instanceof Date
        ? t.updatedAt.toISOString()
        : new Date(t.updatedAt).toISOString(),
  };
}


  async function fetchThread() {
    if (!threadId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/messages/${threadId}`);
      if (!res.ok) throw new Error('Failed to fetch thread');
      const data: ThreadDB = await res.json();
      setThread(mapThreadDBtoUI(data));
    } catch (err) {
      console.error(err);
      setThread(null);
    } finally {
      setLoading(false);
    }
  }

  // --- Fetch thread on mount / thread change ---
  useEffect(() => {
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // --- Mark as read (unchanged behavior) ---
  useEffect(() => {
    if (!threadId || !currentUserId) return;

    async function markRead() {
      try {
        await fetch(`/api/messages/${threadId}`, { method: 'PUT' });
        fetchThread();
      } catch (err) {
        console.error('Failed to mark messages as read', err);
      }
    }

    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, currentUserId]);

  // --- Scroll to bottom when messages change ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  // --- Send message (original logic) ---
  async function sendMessage() {
    if (!newMessage.trim() || !thread || !currentUserId) return;

    const userName = session?.user?.name || 'You';

    const tempMsg: MessageUI = {
      sender: { _id: currentUserId, name: userName },
      content: newMessage,
      timestamp: new Date(),
      readBy: [currentUserId],
    };

    const previousThread = thread;
    setThread({ ...thread, messages: [...thread.messages, tempMsg] });
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(`/api/messages/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageToSend }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const toast = (await import('react-hot-toast')).toast;
        toast.error(errData?.error || 'Your message could not be sent.');
        setThread(previousThread);
        return;
      }

      fetchThread();
    } catch (err) {
      console.error('Failed to send message:', err);
      const toast = (await import('react-hot-toast')).toast;
      toast.error('Something went wrong while sending.');
      setThread(previousThread);
    }
  }

  return {
    thread,
    loading,
    newMessage,
    setNewMessage,
    sendMessage,
    messagesEndRef,
  };
}
