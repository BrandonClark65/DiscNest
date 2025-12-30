"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import GradientButton from "@/components/ui/GradientButton";
import { X } from "lucide-react";

type ReportModalProps = {
  open: boolean;
  onClose: () => void;

  // Reporting context
  reportedUserId: string;
  listingId?: string;
  threadId?: string;
  requestId?: string;
  messageId?: string;

  title?: string;
  subtitle?: string;
};

export default function ReportModal({
  open,
  onClose,
  reportedUserId,
  listingId,
  threadId,
  requestId,
  messageId,
  title = "Report User",
  subtitle = "Your report will be reviewed by the moderation team.",
}: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submitReport() {
    if (!reportedUserId) return;

    setLoading(true);

    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId,
          listingId,
          threadId,
          requestId,
          messageId,
          reason: reason.trim(),
        }),
      });

      toast.success("Report submitted");
      setReason("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] w-full max-w-md rounded-xl p-6 border border-[var(--muted)]/30 shadow-xl">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="p-1 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[var(--foreground)]/70 mb-4">{subtitle}</p>

        {/* REASON INPUT */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional: Describe the issue..."
          rows={4}
          className="
            w-full p-3 rounded-lg border border-[var(--muted)]/30
            bg-[var(--surface)] text-sm text-[var(--foreground)]
            placeholder:text-[var(--foreground)]/40
            focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
          "
        />

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">

          <GradientButton
            label="Cancel"
            onClick={onClose}
            variant="muted"
            className="px-5 py-2"
          />

          <GradientButton
            label={loading ? "Reporting..." : "Submit Report"}
            onClick={submitReport}
            variant="danger"
            className="px-5 py-2"
          />
        </div>
      </div>
    </div>
  );
}
