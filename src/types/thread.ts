import { DiscNestUser as User } from "./user";
import { Listing } from "./listing";
import { DiscRequest } from "./DiscRequest";
import { Message, MessageDB, MessageUI } from "./message";
import { Types } from "mongoose";

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
   THREAD (UI - returned to frontend)
-------------------------------------------------------- */
export type ThreadUI = {
  _id: string;

  participants: Participant[];

  listingId: ListingRef | null;
  requestId: RequestRef | null;

  messages: MessageUI[];
  updatedAt: string;
};

/* -------------------------------------------------------
   THREAD (DB - stored in Mongo)
-------------------------------------------------------- */
export type ThreadDB = {
  _id: Types.ObjectId;

  // Either raw ObjectIds or populated users
  participants: Types.ObjectId[] | (User & { _id: Types.ObjectId })[];

  listingId: Types.ObjectId | Listing | null;
  requestId: Types.ObjectId | DiscRequest | null;

  messages: MessageDB[];
  updatedAt: Date;
};

/* -------------------------------------------------------
   LEGACY TYPE
-------------------------------------------------------- */
export type Thread = {
  _id: string;
  participants: User[];

  listingId: Listing | null;
  requestId: DiscRequest | null;

  messages: Message[];
  updatedAt: string;
};
