'use client';
import { useState } from "react";

export default function MessageSeller({ listing, sellerId }: any) {
  const [message, setMessage] = useState("");

  async function sendMessage() {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: sellerId,
        listingId: listing._id,
        content: message,
      }),
    });
    setMessage("");
    alert("Message sent!");
  }

  return (
    <div className="flex gap-2">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message seller..."
        className="border p-2 rounded w-full"
      />
      <button onClick={sendMessage} className="bg-blue-600 text-white px-3 rounded">
        Send
      </button>
    </div>
  );
}
