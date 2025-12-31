'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { ThreadDB } from '@/types/thread';

/**
 * Hook to check if the current user has any unread messages
 * @returns boolean indicating if there are unread messages
 */
export default function useUnreadMessages(): boolean {
  const { data: session, status } = useSession();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const currentUserId = session?.user ? (session.user as { id?: string }).id : undefined;
    
    if (status !== 'authenticated' || !currentUserId) {
      setHasUnread(false);
      return;
    }

    async function checkUnreadMessages() {
      try {
        const res = await fetch('/api/messages');
        if (!res.ok) return;

        const threads: ThreadDB[] = await res.json();

        // Check if any thread has unread messages
        const unread = threads.some((thread) => {
          if (!thread.messages || thread.messages.length === 0) return false;

          return thread.messages.some((message) => {
            // Get sender ID - handle both string and ObjectId
            const senderId = typeof message.sender === 'string' 
              ? message.sender 
              : typeof message.sender === 'object' && message.sender && '_id' in message.sender
              ? String(message.sender._id)
              : String(message.sender);
            
            // Only check messages sent by others
            if (senderId === currentUserId) return false;

            const readBy = message.readBy || [];
            // Check if current user's ID is in the readBy array
            // Handle both string IDs and ObjectIds
            return !readBy.some((id) => {
              const idStr = typeof id === 'string' ? id : String(id);
              return idStr === currentUserId;
            });
          });
        });

        setHasUnread(unread);
      } catch (error) {
        console.error('Failed to check unread messages:', error);
        setHasUnread(false);
      }
    }

    checkUnreadMessages();

    // Poll for unread messages every 30 seconds
    const interval = setInterval(checkUnreadMessages, 30000);

    // Also check when window regains focus
    const handleFocus = () => checkUnreadMessages();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [status, session?.user]);

  return hasUnread;
}
