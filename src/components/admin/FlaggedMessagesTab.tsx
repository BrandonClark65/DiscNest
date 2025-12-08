"use client";

import { useEffect, useState } from "react";
import GradientButton from "@/components/ui/GradientButton";
import { ShieldAlert, CheckCircle, XCircle, Send, Ban } from "lucide-react";
import type { FlaggedMessageUI } from "@/types/flaggedMessage";
import Link from "next/link";

export default function FlaggedMessagesTab() {
  const [messages, setMessages] = useState<FlaggedMessageUI[]>([]);

  async function load() {
    const res = await fetch("/api/admin/flagged-messages");
    const data: FlaggedMessageUI[] = await res.json();
    setMessages(data);
  }

  async function takeAction(id: string, action: string) {
    await fetch(`/api/admin/flagged-messages/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldAlert className="text-red-500" /> Flagged Messages
      </h1>

      {messages.length === 0 ? (
        <p className="text-gray-500">No flagged messages 🎉</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className="p-4 border rounded-xl bg-white shadow-sm space-y-3"
            >
              {/* Sender */}
              <div className="text-sm">
                <strong>Sender:</strong> {msg.sender.name} ({msg.sender.email})
              </div>

              {/* Message */}
              <div className="text-sm">
                <strong>Message:</strong>{" "}
                <span className="text-red-600">{msg.content}</span>
              </div>

              {/* Thread Link */}
              <div className="text-sm">
                <strong>Thread:</strong>{" "}
                {msg.threadId?.listingId ? (
                  <Link
                    href={`/messages/${msg.threadId._id}`}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    View thread for: &quot;{msg.threadId.listingId.title}&quot;
                  </Link>
                ) : (
                  <Link
                    href={`/messages/${msg.threadId._id}`}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    View thread
                  </Link>
                )}
              </div>

              {/* Categories */}
              <div className="text-xs text-gray-500">
                Categories: {Object.keys(msg.categories).join(", ")}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <GradientButton
                  label="Deliver"
                  icon={<Send className="w-4 h-4" />}
                  onClick={() => takeAction(msg._id, "deliver")}
                />

                <GradientButton
                  label="Resolve"
                  variant="muted"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => takeAction(msg._id, "resolve")}
                />

                <GradientButton
                  label="Reject"
                  variant="danger"
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={() => takeAction(msg._id, "reject")}
                />

                <GradientButton
                  label="Ban User"
                  variant="danger"
                  icon={<Ban className="w-4 h-4" />}
                  onClick={() => takeAction(msg._id, "ban")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
