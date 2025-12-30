'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Session } from 'next-auth';
import type { ThreadDB, ThreadUI } from '@/types/thread';
import type { MessageUI } from '@/types/message';
import { mapThreadDBtoUI } from '@/lib/messageMapping';
import { useAnalytics } from '@/lib/useAnalytics';

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
  const { trackEvent } = useAnalytics();
  const [thread, setThread] = useState<ThreadUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ----------------------------
  // Fetch thread from API
  // ----------------------------
  async function fetchThread() {
    if (!threadId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/messages/${threadId}`);
      if (!res.ok) throw new Error('Failed to fetch thread');

      const data: ThreadDB = await res.json();
      
      // Fix participants before mapping if they have invalid _id values
      // This handles cases where ObjectIds weren't properly serialized
      if (data.participants && Array.isArray(data.participants)) {
        data.participants = data.participants.map((p: unknown) => {
          // If it's already a string, use it
          if (typeof p === 'string') {
            return p;
          }
          
          // If it's an object with _id
          if (p && typeof p === 'object' && '_id' in p) {
            const pObj = p as { _id: unknown; [key: string]: unknown };
            const id = pObj._id;
            
            // If _id is a valid string, return the object as-is
            if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
              return p;
            }
            
            // If _id is an object, try to extract the string ID
            if (id && typeof id === 'object') {
              // Try common ObjectId properties
              const idObj = id as Record<string, unknown>;
              if (typeof idObj.id === 'string' && /^[0-9a-fA-F]{24}$/.test(idObj.id)) {
                return { ...pObj, _id: idObj.id };
              }
              if (typeof idObj.$oid === 'string' && /^[0-9a-fA-F]{24}$/.test(idObj.$oid)) {
                return { ...pObj, _id: idObj.$oid };
              }
              // Try toString if available
              if ('toString' in id && typeof (id as { toString: () => string }).toString === 'function') {
                try {
                  const idStr = (id as { toString: () => string }).toString();
                  if (idStr !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(idStr)) {
                    return { ...pObj, _id: idStr };
                  }
                } catch (e) {
                  // Ignore
                }
              }
            }
          }
          
          return p;
        }) as typeof data.participants;
      }
      
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

  // --- Mark thread as read ---
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

  // --- Scroll to bottom when messages update ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  // ----------------------------
  // Send message (optimistic update)
  // ----------------------------
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

    // Optimistic update
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

        // Revert optimistic update
        setThread(previousThread);
        return;
      }

      // Track message sent event
      trackEvent('message_sent', {
        thread_id: threadId,
        listing_id: thread.listingId?._id,
        listing_title: thread.listingId?.title,
      });

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
