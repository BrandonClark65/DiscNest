"use client";

import { X } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">{message}</p>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3">
          <GradientButton
            label={cancelLabel}
            onClick={onClose}
            variant="muted"
            className="px-5 py-2"
            disabled={loading}
          />

          <GradientButton
            label={loading ? "Processing..." : confirmLabel}
            onClick={handleConfirm}
            variant={variant}
            className="px-5 py-2"
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}

