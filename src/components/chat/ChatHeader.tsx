"use client";

import { ArrowBigLeft, MoreVertical, ExternalLink } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import ReportMenu from "./ReportMenu";
import type { ThreadUI } from "@/types/thread";

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

  const listing = thread.listingId;
  const request = thread.requestId;

  // 🛠 FIXED: Detect valid IDs only
  const hasListing = listing?._id && listing._id !== "unknown";
  const hasRequest = request?._id && request._id !== "unknown";

  // Title priority:
  // 1) Listing thread
  // 2) Request thread
  // 3) Fallback to generic conversation
  const headerTitle = hasListing
    ? listing?.title || "Listing"
    : hasRequest
    ? `Request: ${request?.title}`
    : "Conversation";

  // View buttons
  const viewUrl = hasListing
    ? `/listing/${listing?._id}`
    : hasRequest
    ? `/requests/${request?._id}`
    : null;

  const viewLabel = hasListing
    ? "View Listing"
    : hasRequest
    ? "View Request"
    : null;

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

        {viewUrl && (
          <GradientButton
            label={viewLabel!}
            icon={<ExternalLink className="w-5 h-5" />}
            onClick={() => (window.location.href = viewUrl)}
            className="px-4 py-2 w-full sm:w-auto"
          />
        )}
      </div>

      {/* HEADER + REPORT BUTTON */}
      <div className="flex items-center justify-between mb-4 relative">
        <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
          {headerTitle}
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
