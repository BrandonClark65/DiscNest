'use client';

import { useEffect, useState } from "react";
import { DiscNestUser as User } from '@/types/user';
import { Listing } from '@/types/listing';
import { Message } from '@/types/message';
import { Thread } from '@/types/thread';


export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThreads() {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setThreads(data);
      setLoading(false);
    }
    fetchThreads();
  }, []);

  if (loading) return <p>Loading your messages...</p>;
  if (!threads.length) return <p>No messages yet.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      <ul className="space-y-4">
        {threads.map((thread) => {
          const lastMessage = thread.messages[thread.messages.length - 1];
          const otherUser = thread.participants.find((p) => p._id !== lastMessage.sender._id);

          return (
            <li key={thread._id} className="border rounded p-3 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                {thread.listingId.imageUrls[0] && (
                  <img
                    src={thread.listingId.imageUrls[0]}
                    alt={thread.listingId.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{thread.listingId.title}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{otherUser?.name}:</span> {lastMessage.content}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(lastMessage.timestamp).toLocaleString()}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
