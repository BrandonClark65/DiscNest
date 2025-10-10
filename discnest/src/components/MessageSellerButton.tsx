'use client';

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import ChatModal from "@/components/ChatModal";

type MessageSellerButtonProps = {
  sellerId: string;
  listingId: string;
};

export default function MessageSellerButton({ sellerId, listingId }: MessageSellerButtonProps) {
  const { data: session } = useSession();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleMessageSeller() {
    if (!session) {
      signIn();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: sellerId, listingId }),
      });
      if (!res.ok) throw new Error("Failed to start message thread");
      const thread = await res.json();
      setThreadId(thread._id); // opens modal
    } catch (err) {
      console.error(err);
      alert("Could not open chat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleMessageSeller}
        disabled={loading}
        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Opening chat..." : "Message Seller"}
      </button>

      {threadId && <ChatModal threadId={threadId} onClose={() => setThreadId(null)} />}
    </>
  );
}


