'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { Thread } from "@/types/thread";

export default function MessagesPage() {
  const { data: session } = useSession();
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

  if (loading) return <p className="p-4">Loading threads...</p>;
  if (!threads.length) return <p className="p-4">No messages yet.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <ul className="space-y-2">
        {threads.map((thread) => {
          const otherUser = thread.participants.find(
            (p) => p._id !== session?.user?.id
          );
          const lastMessage = thread.messages?.[thread.messages.length - 1];

          return (
            <li key={thread._id} className="border rounded p-3 hover:bg-gray-50">
              <Link href={`/messages/${thread._id}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{otherUser?.name}</p>
                    <p className="text-sm text-gray-500">
                      {thread.listingId?.title}
                    </p>
                    <p className="text-sm text-gray-700 truncate">
                      {lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(thread.updatedAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

