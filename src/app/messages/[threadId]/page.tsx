'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import useChatThread from '@/hooks/useChatThread';
import type { ThreadUI } from '@/types/thread';
import RatingPrompt from '@/components/ratings/RatingPrompt';

// Lazy load ReportModal for better performance
const ReportModal = dynamic(() => import('@/components/modals/ReportModal'), {
  ssr: false,
});

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user ? (session.user as { id?: string }).id : undefined;
  const router = useRouter();

  const params = useParams();
  const threadId = params?.threadId as string | undefined;

  const {
    thread,
    loading,
    newMessage,
    setNewMessage,
    sendMessage,
    messagesEndRef,
  } = useChatThread(threadId, currentUserId, (session as unknown as import('next-auth').Session) || null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportContext, setReportContext] = useState<{
    reportedUserId: string;
    threadId: string;
    messageId?: string;
  } | null>(null);

  // Rating eligibility state
  const [ratingEligible, setRatingEligible] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [listingId, setListingId] = useState<string | undefined>(undefined);

  const openReportModal = (ctx: {
    reportedUserId: string;
    threadId: string;
    messageId?: string;
  }) => {
    setReportContext(ctx);
    setReportOpen(true);
  };

  // Check rating eligibility when thread loads, updates, or window regains focus
  useEffect(() => {
    if (!thread || !currentUserId) {
      setRatingEligible(false);
      return;
    }

    // Find the other user by iterating through participants and extracting valid IDs
    // This approach is more robust than finding first and then extracting
    let otherUserIdString: string | null = null;
    let otherUserName: string = 'User';
    
    for (const participant of thread.participants) {
      // Extract ID from this participant
      const extractId = (id: unknown): string | null => {
        if (!id) {
          return null;
        }
        
        // If it's already a valid string ID
        if (typeof id === 'string') {
          if (id === '[object Object]') {
            return null;
          }
          if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return null;
          }
          return id;
        }
        
        // If it's an object, try to extract
        if (id && typeof id === 'object') {
          // Try toHexString() for Mongoose ObjectId
          if ('toHexString' in id && typeof (id as { toHexString: () => string }).toHexString === 'function') {
            try {
              const hexStr = (id as { toHexString: () => string }).toHexString();
              if (/^[0-9a-fA-F]{24}$/.test(hexStr)) {
                return hexStr;
              }
            } catch (e) {
              // Continue
            }
          }
          
          // Try toString()
          if ('toString' in id && typeof (id as { toString: () => string }).toString === 'function') {
            try {
              const idStr = (id as { toString: () => string }).toString();
              if (idStr !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(idStr)) {
                return idStr;
              }
            } catch (e) {
              // Continue
            }
          }
          
          // Try common properties
          const idObj = id as Record<string, unknown>;
          if (typeof idObj.id === 'string' && /^[0-9a-fA-F]{24}$/.test(idObj.id)) {
            return idObj.id;
          }
        }
        
        return null;
      };
      
      let participantId = extractId(participant._id);
      
      // If extraction failed and we got "[object Object]", try to find ID in the raw thread data
      // This is a workaround for when the mapping fails
      if (!participantId && participant._id === '[object Object]') {
        // Try to access the thread's raw data if available
        // Check if participant has any other properties that might contain the ID
        const participantObj = participant as Record<string, unknown>;
        for (const key of Object.keys(participantObj)) {
          if (key !== '_id' && key !== 'name') {
            const altId = extractId(participantObj[key]);
            if (altId && /^[0-9a-fA-F]{24}$/.test(altId)) {
              participantId = altId;
              break;
            }
          }
        }
        
        // If still not found, try to get it from the thread's raw participants
        // by comparing names or other properties
        if (!participantId) {
          // The currentUserId is valid, so we can use it to find the other participant
          // by process of elimination
          const allParticipantIds = thread.participants
            .map(p => {
              const id = p._id;
              if (typeof id === 'string' && id !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(id)) {
                return id;
              }
              // Try toString if it's an object
              if (id && typeof id === 'object' && 'toString' in id) {
                try {
                  const str = (id as { toString: () => string }).toString();
                  if (str !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(str)) {
                    return str;
                  }
                } catch (e) {
                  // Ignore
                }
              }
              return null;
            })
            .filter((id): id is string => id !== null && id !== currentUserId);
          
          if (allParticipantIds.length > 0) {
            participantId = allParticipantIds[0];
          }
        }
      }
      
      // Skip if this is the current user or if ID is invalid
      if (!participantId || participantId === currentUserId) {
        continue;
      }
      
      // Found a valid other user
      otherUserIdString = participantId;
      
      // Try to get the name from participant first
      let extractedName = participant.name;
      
      // If name is "Unknown" or missing, try to get it from messages
      if (!extractedName || extractedName === 'Unknown') {
        // Find a message from this user to get their name
        const userMessage = thread.messages?.find((msg) => {
          const msgSenderId = typeof msg.sender === 'object' && msg.sender?._id
            ? msg.sender._id
            : typeof msg.sender === 'string'
            ? msg.sender
            : null;
          return msgSenderId === participantId;
        });
        
        if (userMessage && typeof userMessage.sender === 'object' && userMessage.sender?.name) {
          extractedName = userMessage.sender.name;
        }
      }
      
      otherUserName = extractedName || 'User';
      break;
    }

    // Only proceed if we have a valid user ID
    // Double-check it's not the problematic "[object Object]" string
    if (!otherUserIdString || 
        otherUserIdString === '[object Object]' || 
        !/^[0-9a-fA-F]{24}$/.test(otherUserIdString)) {
      setRatingEligible(false);
      setOtherUserId(null);
      return;
    }

    setOtherUserId(otherUserIdString);
    setOtherUserName(otherUserName);
    
    // Safely extract listingId string
    const listingIdString = (() => {
      const listing = thread.listingId;
      if (!listing) return undefined;
      if (typeof listing === 'object' && listing !== null && '_id' in listing) {
        const listingId = (listing as { _id: unknown })._id;
        if (typeof listingId === 'string' && /^[0-9a-fA-F]{24}$/.test(listingId)) {
          return listingId;
        }
        if (listingId && typeof listingId === 'object' && 'toString' in listingId) {
          const idStr = (listingId as { toString: () => string }).toString();
          if (idStr !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(idStr)) {
            return idStr;
          }
        }
      }
      if (typeof listing === 'string' && /^[0-9a-fA-F]{24}$/.test(listing)) {
        return listing;
      }
      return undefined;
    })();
    setListingId(listingIdString);

    // Check eligibility function
    const checkEligibility = async () => {
      // Validate the user ID before making the API call
      if (!otherUserIdString || 
          otherUserIdString === '[object Object]' || 
          !/^[0-9a-fA-F]{24}$/.test(otherUserIdString)) {
        setRatingEligible(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/ratings/eligibility/${otherUserIdString}`);
        
        if (res.ok) {
          const data = await res.json();
          
          // Check if there's an eligible interaction for this listing
          const eligibleForThisListing = data.interactions?.some(
            (interaction: { listingId?: string; eligible: boolean }) =>
              interaction.eligible &&
              (listingIdString ? interaction.listingId === listingIdString : true)
          );
          
          setRatingEligible(eligibleForThisListing || data.eligible);
        } else {
          setRatingEligible(false);
        }
      } catch (err) {
        console.error('Error checking rating eligibility:', err);
        setRatingEligible(false);
      }
    };

    // Check immediately
    checkEligibility();

    // Re-check when window regains focus (user comes back to tab)
    const handleFocus = () => {
      checkEligibility();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [thread, currentUserId]);

  // Re-check eligibility when thread messages update (e.g., when listing is marked as sold)
  // This ensures the rating prompt appears after the listing status changes
  useEffect(() => {
    if (!otherUserId || 
        otherUserId === '[object Object]' || 
        !/^[0-9a-fA-F]{24}$/.test(otherUserId)) {
      return;
    }
    
    const checkEligibility = async () => {
      try {
        const res = await fetch(`/api/ratings/eligibility/${otherUserId}`);
        if (res.ok) {
          const data = await res.json();
          
          const eligibleForThisListing = data.interactions?.some(
            (interaction: { listingId?: string; eligible: boolean }) =>
              interaction.eligible &&
              (listingId ? interaction.listingId === listingId : true)
          );
          
          setRatingEligible(eligibleForThisListing || data.eligible);
        }
      } catch (err) {
        console.error('Error checking rating eligibility:', err);
      }
    };
    
    // Small delay to allow listing status to update in database
    const timeoutId = setTimeout(checkEligibility, 1000);
    return () => clearTimeout(timeoutId);
  }, [thread?.messages?.length, thread?.updatedAt, otherUserId, listingId]);

  if (loading) {
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70 animate-pulse">
        Loading chat...
      </p>
    );
  }

  if (!thread) {
    return (
      <p className="p-6 text-center text-[var(--foreground)]/70">
        Thread not found.
      </p>
    );
  }

  // Determine role: if there's a listing, current user is buyer if they don't own it
  // For simplicity, we'll use 'buyer' as default (can be enhanced later)
  const role = 'buyer';

  return (
    <>
      <div className="relative max-w-3xl mx-auto p-4 sm:p-6 flex flex-col h-[80vh] text-[var(--foreground)]">
        <ChatHeader
          thread={thread as ThreadUI}
          currentUserId={currentUserId}
          onBack={() => router.push('/messages')}
          onReportUser={(userId) =>
            openReportModal({ reportedUserId: userId, threadId: thread._id })
          }
        />

        {/* Rating Prompt - show if eligible */}
        {ratingEligible && otherUserId && (
          <div className="mb-4">
            <RatingPrompt
              ratedUserId={otherUserId}
              ratedUserName={otherUserName}
              listingId={listingId}
              role={role}
              onRated={() => {
                setRatingEligible(false);
                // Refresh thread to update any rating-related data
                window.location.reload();
              }}
            />
          </div>
        )}

        <MessageList
          thread={thread as ThreadUI}
          currentUserId={currentUserId}
          onReportMessage={(messageId, senderId) =>
            openReportModal({
              reportedUserId: senderId,
              threadId: thread._id,
              messageId,
            })
          }
          messagesEndRef={messagesEndRef}
        />

        <MessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={sendMessage}
        />
      </div>

      {reportContext && (
        <ReportModal
          open={reportOpen}
          onClose={() => {
            setReportOpen(false);
            setReportContext(null);
          }}
          reportedUserId={reportContext.reportedUserId}
          threadId={reportContext.threadId}
          messageId={reportContext.messageId}
        />
      )}
    </>
  );
}
