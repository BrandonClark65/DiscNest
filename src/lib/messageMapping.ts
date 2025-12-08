// src/lib/messageMapping.ts

import { Types } from "mongoose";
import type { MessageDB, MessageUI } from "@/types/message";
import type { ThreadDB, ThreadUI } from "@/types/thread";

/* -------------------------------------------------------
   TYPE GUARDS
-------------------------------------------------------- */

// Raw ObjectId value
function isObjectId(value: unknown): value is Types.ObjectId {
  return value instanceof Types.ObjectId;
}

// Populated user: { _id: ObjectId, name: string, ... }
function isPopulatedUser(
  value: unknown
): value is { _id: Types.ObjectId; name: string } {
  return (
    value !== null &&
    typeof value === "object" &&
    "_id" in value &&
    value._id instanceof Types.ObjectId &&
    "name" in value &&
    typeof value.name === "string"
  );
}

// Populated Listing: { _id: ObjectId, title: string }
function isPopulatedListing(
  value: unknown
): value is { _id: Types.ObjectId; title: string; imageUrls?: string[] } {
  return (
    value !== null &&
    typeof value === "object" &&
    "_id" in value &&
    value._id instanceof Types.ObjectId &&
    "title" in value
  );
}

// Populated Request: { _id: ObjectId, title: string }
function isPopulatedRequest(
  value: unknown
): value is { _id: Types.ObjectId; title: string } {
  return (
    value !== null &&
    typeof value === "object" &&
    "_id" in value &&
    value._id instanceof Types.ObjectId &&
    "title" in value
  );
}

/* -------------------------------------------------------
   MESSAGE MAPPING
-------------------------------------------------------- */

export function mapMessageDBtoUI(msg: MessageDB): MessageUI {
  const SYSTEM_IDS: (null | undefined | string)[] = [
    null,
    undefined,
    "",
    "unknown",
    "system",
    "000000000000000000000000",
  ];

  // Extract sender as simple string ID
  const rawSender =
    msg.sender === null
      ? null
      : typeof msg.sender === "string"
      ? msg.sender
      : msg.sender._id?.toString() ?? null;

  // Check if rawSender is a system ID (handles null, undefined, strings)
  // Explicitly check for null/undefined first, then check array for strings
  const isSystem = 
    rawSender === null || 
    rawSender === undefined || 
    (typeof rawSender === "string" && SYSTEM_IDS.includes(rawSender));

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

  interface SenderWithName {
    _id?: unknown;
    name?: string;
  }

  const senderName =
    typeof msg.sender === "object" &&
    msg.sender !== null &&
    "_id" in msg.sender &&
    "name" in msg.sender &&
    typeof (msg.sender as SenderWithName).name === "string"
      ? (msg.sender as SenderWithName).name
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

/* -------------------------------------------------------
   THREAD MAPPING
-------------------------------------------------------- */

export function mapThreadDBtoUI(t: ThreadDB): ThreadUI {
  return {
    _id: t._id.toString(),

    /* -------------------------------
          PARTICIPANTS
    -------------------------------- */
    participants: t.participants.map((p) => {
      if (isPopulatedUser(p)) {
        return {
          _id: p._id.toString(),
          name: p.name || "Unknown",
        };
      }

      if (isObjectId(p)) {
        return {
          _id: p.toString(),
          name: "Unknown",
        };
      }

      // Fallback (string or unknown)
      return {
        _id: String(p),
        name: "Unknown",
      };
    }),

    /* -------------------------------
          LISTING REF
    -------------------------------- */
    listingId: (() => {
      const l = t.listingId;

      if (!l) {
        return {
          _id: "unknown",
          title: "Listing Unavailable",
          imageUrls: [],
        };
      }

      if (isPopulatedListing(l)) {
        return {
          _id: l._id.toString(),
          title: l.title || "Listing",
          imageUrls: l.imageUrls || [],
        };
      }

      if (isObjectId(l)) {
        return {
          _id: l.toString(),
          title: "",
          imageUrls: [],
        };
      }

      return {
        _id: String(l),
        title: "",
        imageUrls: [],
      };
    })(),

    /* -------------------------------
          REQUEST REF
    -------------------------------- */
    requestId: (() => {
      const r = t.requestId;

      if (!r) return null;

      if (isPopulatedRequest(r)) {
        return {
          _id: r._id.toString(),
          title: r.title || "Disc Request",
        };
      }

      if (isObjectId(r)) {
        return {
          _id: r.toString(),
          title: "Disc Request",
        };
      }

      return {
        _id: String(r),
        title: "Disc Request",
      };
    })(),

    /* -------------------------------
          MESSAGES
    -------------------------------- */
    messages: t.messages.map(mapMessageDBtoUI),

    /* -------------------------------
          UPDATED AT
    -------------------------------- */
    updatedAt:
      t.updatedAt instanceof Date
        ? t.updatedAt.toISOString()
        : new Date(t.updatedAt).toISOString(),
  };
}
