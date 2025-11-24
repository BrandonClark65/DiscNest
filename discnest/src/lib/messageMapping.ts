// src/lib/messageMapping.ts

import type { MessageDB, MessageUI } from "@/types/message";
import type { ThreadDB, ThreadUI } from "@/types/thread";

export function mapMessageDBtoUI(msg: MessageDB): MessageUI {
  const SYSTEM_IDS = [
    null,
    undefined,
    "",
    "unknown",
    "system",
    "000000000000000000000000",
  ];

  // Extract raw sender ID as a string
  const rawSender =
    msg.sender === null
      ? null
      : typeof msg.sender === "string"
      ? msg.sender
      : msg.sender._id?.toString() ?? null;

  // Identify system message
  const isSystem = SYSTEM_IDS.includes(rawSender as any);

  if (isSystem) {
    return {
      sender: { _id: "system", name: "Automated Message" },
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      readBy: msg.readBy?.map((id) => id.toString()) || [],
      flagged: msg.flagged ?? false,
      flaggedCategories: msg.flaggedCategories ?? {},
    };
  }

  // Normal user message
  const senderName =
    typeof msg.sender === "object" && msg.sender && "_id" in msg.sender
      ? (msg.sender as any).name || "Unknown"
      : "Unknown";

  return {
    sender: { _id: rawSender!, name: senderName },
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    readBy: msg.readBy?.map((id) => id.toString()) || [],
    flagged: msg.flagged ?? false,
    flaggedCategories: msg.flaggedCategories ?? {},
  };
}


export function mapThreadDBtoUI(t: ThreadDB): ThreadUI {
  return {
    _id: t._id.toString(),

    messages: t.messages.map(mapMessageDBtoUI),

    participants: t.participants.map((p) => {
      if (typeof p === "string") return { _id: p, name: "Unknown" };
      if ("_id" in p)
        return { _id: p._id.toString(), name: (p as any).name || "Unknown" };
      return { _id: p.toString(), name: "Unknown" };
    }),

    listingId: (() => {
      const l = t.listingId;

      if (!l) {
        return {
          _id: "unknown",
          title: "Listing Unavailable",
          imageUrls: [],
        };
      }

      if (typeof l === "object" && "_id" in l) {
        return {
          _id: l._id.toString(),
          title: (l as any).title || "Listing",
          imageUrls: (l as any).imageUrls || [],
        };
      }

      return {
        _id: l.toString(),
        title: "",
        imageUrls: [],
      };
    })(),

    requestId: (() => {
      const r = t.requestId;

      if (!r) return null;

      if (typeof r === "object" && "_id" in r) {
        return {
          _id: r._id.toString(),
          title: (r as any).title || "Disc Request",
        };
      }

      return { _id: r.toString(), title: "Disc Request" };
    })(),

    updatedAt:
      t.updatedAt instanceof Date
        ? t.updatedAt.toISOString()
        : new Date(t.updatedAt).toISOString(),
  };
}
