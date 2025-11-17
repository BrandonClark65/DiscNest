'use client';

import { ArrowBigLeft, MoreVertical, ExternalLink } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import ReportMenu from './ReportMenu';
import type { ThreadUI } from '@/types/thread';

type ChatHeaderProps = {
  thread: ThreadUI;
  currentUserId?: string;
  onBack: () => void;
  onReportUser: (userId: string) => void;
};

export default function ChatHeader({
  thread,
  currentUserId,
  onBack,
  onReportUser,
}: ChatHeaderProps) {
  const otherUser = thread.participants.find((p) => p._id !== currentUserId);

  const listingId = thread.listingId?._id || null;

  return (
    <>
      {/* TOP BUTTON ROW */}
      <div className="mb-3 flex flex-col sm:flex-row gap-2">
        <GradientButton
          label="Back to Messages"
          icon={<ArrowBigLeft className="w-5 h-5" />}
          onClick={onBack}
          variant="muted"
          className="px-4 py-2 w-full sm:w-auto"
        />

        {listingId && (
          <GradientButton
            label="View Listing"
            icon={<ExternalLink className="w-5 h-5" />}
            onClick={() => window.location.href = `/listing/${listingId}`}
            className="px-4 py-2 w-full sm:w-auto"
          />
        )}
      </div>

      {/* HEADER TITLE + REPORT */}
      <div className="flex items-center justify-between mb-4 relative">
        <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
          {thread.listingId?.title || 'Conversation'}
        </h1>

        {otherUser && (
          <ReportMenu
            align="right"
            label="Report User"
            onReport={() => onReportUser(otherUser._id)}
          >
            <MoreVertical className="w-5 h-5 text-[var(--foreground)]/70" />
          </ReportMenu>
        )}
      </div>
    </>
  );
}
