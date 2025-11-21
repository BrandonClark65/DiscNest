import { DiscNestUser as User } from "./user";
import { Listing } from "./listing";
import { DiscRequest } from "./DiscRequest";
import { Message, MessageDB, MessageUI } from "./message";
import { ObjectId } from "mongoose";

/* -------------------------------------------------------
   PARTICIPANTS (UI)
-------------------------------------------------------- */
export type Participant = {
  _id: string;
  name: string;
};

/* -------------------------------------------------------
   LISTING + REQUEST (UI REFERENCES)
-------------------------------------------------------- */
export type ListingRef = {
  _id: string;
  title: string;
  imageUrls?: string[];
};

export type RequestRef = {
  _id: string;
  title: string;
};

/* -------------------------------------------------------
   THREAD (UI — returned to frontend)
-------------------------------------------------------- */
export type ThreadUI = {
  _id: string;

  participants: Participant[];

  // Only ONE of these will exist
  listingId: ListingRef | null;
  requestId: RequestRef | null;

  messages: MessageUI[];
  updatedAt: string;
};

/* -------------------------------------------------------
   THREAD (DB — stored in Mongo)
-------------------------------------------------------- */
export type ThreadDB = {
  _id: ObjectId;

  participants: ObjectId[] | (User & { _id: ObjectId })[];

  // Optional and nullable — only one is populated per thread
  listingId: ObjectId | Listing | null;
  requestId: ObjectId | DiscRequest | null;

  messages: MessageDB[];
  updatedAt: Date;
};

/* -------------------------------------------------------
   LEGACY TYPE (for older code — safe to keep)
-------------------------------------------------------- */
export type Thread = {
  _id: string;
  participants: User[];

  listingId: Listing | null;
  requestId: DiscRequest | null;

  messages: Message[];
  updatedAt: string;
};
