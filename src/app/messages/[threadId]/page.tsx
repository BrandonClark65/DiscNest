'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import ReportModal from '@/components/modals/ReportModal';
import useChatThread from '@/hooks/useChatThread';
import type { ThreadUI } from '@/types/thread';

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
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
  } = useChatThread(threadId, currentUserId, session || null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportContext, setReportContext] = useState<{
    reportedUserId: string;
    threadId: string;
    messageId?: string;
  } | null>(null);

  const openReportModal = (ctx: {
    reportedUserId: string;
    threadId: string;
    messageId?: string;
  }) => {
    setReportContext(ctx);
    setReportOpen(true);
  };

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
