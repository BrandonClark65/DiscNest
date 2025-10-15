'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ThreadDB, ThreadUI } from "@/types/thread";
import type { MessageDB, MessageUI } from "@/types/message";

// Convert DB message → UI message
function mapMessageDBtoUI(msg: MessageDB): MessageUI {
  let senderId = "";
  let senderName = "Unknown";

  if (typeof msg.sender === "string") {
    senderId = msg.sender;
  } else if ("_id" in msg.sender) {
    senderId = msg.sender._id.toString();
    senderName = (msg.sender as any).name || "Unknown";
  }
  return {
    sender: { _id: senderId, name: senderName },
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    readBy: msg.readBy.map((id) => id.toString()),
  };
}

// Convert DB thread → UI thread
function mapThreadDBtoUI(thread: ThreadDB): ThreadUI {
  return {
    _id: thread._id.toString(),
    participants: thread.participants.map((p) =>
      "_id" in p
        ? { _id: p._id.toString(), name: (p as any).name || "Unknown" }
        : { _id: p.toString(), name: "Unknown" }
    ),
    listingId:
      typeof thread.listingId === "object" && "_id" in thread.listingId
        ? {
            _id: thread.listingId._id.toString(),
            title: thread.listingId.title,
            imageUrls: (thread.listingId as any).imageUrls || [],
          }
        : { _id: thread.listingId.toString(), title: "", imageUrls: [] },
    messages: thread.messages.map(mapMessageDBtoUI),
    updatedAt: new Date(thread.updatedAt).toISOString(),
  };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [threads, setThreads] = useState<ThreadUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      const res = await fetch("/api/messages");
      const data: ThreadDB[] = await res.json();

      const threadsUI = data.map(mapThreadDBtoUI);

      const sorted = threadsUI.sort((a, b) => {
        const aLast = a.messages?.[a.messages.length - 1]?.timestamp || a.updatedAt;
        const bLast = b.messages?.[b.messages.length - 1]?.timestamp || b.updatedAt;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });

      setThreads(sorted);
      setLoading(false);
    };

    fetchThreads();

    const handleFocus = () => fetchThreads();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  if (loading) return <p className="p-4">Loading threads...</p>;
  if (!threads.length) return <p className="p-4">No messages yet.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <ul className="space-y-2">
        {threads.map((thread) => {
          const otherUser = thread.participants.find((p) => p._id !== currentUserId);
          const lastMessage = thread.messages?.[thread.messages.length - 1];

          const hasUnread = currentUserId
            ? thread.messages?.some((m) => !(m.readBy || []).includes(currentUserId))
            : false;

          return (
            <li
              key={thread._id}
              className={`border rounded p-3 hover:bg-gray-50 ${
                hasUnread ? "bg-blue-50" : ""
              }`}
            >
              <Link href={`/messages/${thread._id}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      {otherUser?.name}
                      {hasUnread && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{thread.listingId?.title}</p>
                    <p className="text-sm text-gray-700 truncate">
                      {lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(lastMessage?.timestamp || thread.updatedAt).toLocaleString()}
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
