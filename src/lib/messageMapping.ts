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
    sender: { _id: rawSender || '', name: senderName || 'Unknown' },
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
      // If String(p) would produce "[object Object]", try to extract _id from the object
      if (p && typeof p === 'object' && '_id' in p) {
        const pObj = p as { _id: unknown };
        const id = pObj._id;
        
        // Try to extract the ID properly
        if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
          return {
            _id: id,
            name: "Unknown",
          };
        }
        
        if (id && typeof id === 'object') {
          // Try toHexString for Mongoose ObjectId
          if ('toHexString' in id && typeof (id as { toHexString: () => string }).toHexString === 'function') {
            try {
              const hexStr = (id as { toHexString: () => string }).toHexString();
              if (/^[0-9a-fA-F]{24}$/.test(hexStr)) {
                return {
                  _id: hexStr,
                  name: "Unknown",
                };
              }
            } catch (e) {
              // Continue to toString
            }
          }
          
          // Try toString
          if ('toString' in id && typeof (id as { toString: () => string }).toString === 'function') {
            try {
              const idStr = (id as { toString: () => string }).toString();
              if (idStr !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(idStr)) {
                return {
                  _id: idStr,
                  name: "Unknown",
                };
              }
            } catch (e) {
              // Continue
            }
          }
        }
      }
      
      // Last resort: String conversion (but log a warning)
      const strId = String(p);
      if (strId === '[object Object]') {
        console.warn('[messageMapping] Failed to extract participant ID, got "[object Object]"', p);
      }
      
      return {
        _id: strId,
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

    // Fully populated listing with ObjectId _id
    if (isPopulatedListing(l)) {
      return {
        _id: l._id.toString(),
        title: l.title || "Listing",
        imageUrls: l.imageUrls || [],
      };
    }

    // Raw ObjectId
    if (isObjectId(l)) {
      return {
        _id: l.toString(),
        title: "",
        imageUrls: [],
      };
    }

    // Fallback: unknown object / primitive — try to safely unwrap _id if present
    if (typeof l === "object" && l !== null && "_id" in l) {
      const anyListing = l as { _id?: unknown; title?: unknown; imageUrls?: unknown };
      const id =
        typeof anyListing._id === "string"
          ? anyListing._id
          : anyListing._id &&
            typeof (anyListing._id as { toString?: () => string }).toString ===
              "function"
          ? (anyListing._id as { toString: () => string }).toString()
          : String(anyListing._id ?? "");

      return {
        _id: id,
        title:
          typeof anyListing.title === "string" && anyListing.title.length
            ? anyListing.title
            : "",
        imageUrls: Array.isArray(anyListing.imageUrls)
          ? (anyListing.imageUrls as string[])
          : [],
      };
    }

    // Last resort: primitive value
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

      // Fully populated request with ObjectId _id
      if (isPopulatedRequest(r)) {
        return {
          _id: r._id.toString(),
          title: r.title || "Disc Request",
        };
      }

      // Raw ObjectId
      if (isObjectId(r)) {
        return {
          _id: r.toString(),
          title: "Disc Request",
        };
      }

      // Fallback: unknown object / primitive — try to safely unwrap _id if present
      if (typeof r === "object" && r !== null && "_id" in r) {
        const anyRequest = r as { _id?: unknown; title?: unknown };
        const id =
          typeof anyRequest._id === "string"
            ? anyRequest._id
            : anyRequest._id &&
              typeof (anyRequest._id as { toString?: () => string }).toString ===
                "function"
            ? (anyRequest._id as { toString: () => string }).toString()
            : String(anyRequest._id ?? "");

        return {
          _id: id,
          title:
            typeof anyRequest.title === "string" && anyRequest.title.length
              ? anyRequest.title
              : "Disc Request",
        };
      }

      // Last resort: primitive value
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
