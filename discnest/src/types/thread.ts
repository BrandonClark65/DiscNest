import { DiscNestUser as User } from "./user";
import { Listing } from "./listing";
import { Message, MessageDB, MessageUI } from "./message";
import { ObjectId } from "mongoose";

export type Thread = {
  _id: string;
  participants: User[];
  listingId: Listing;
  messages: Message[];
  updatedAt: string;
};

export type Participant = {
  _id: string;
  name: string;
};

export type ListingRef = {
  _id: string;
  title: string;
  imageUrls?: string[];
};

// DB representation of thread
export type ThreadDB = {
  _id: ObjectId;
  participants: ObjectId[] | (User & { _id: ObjectId })[];
  listingId: ObjectId | Listing;
  messages: MessageDB[];
  updatedAt: Date;
};

// UI-friendly thread type (frontend)
export type ThreadUI = {
  _id: string;
  participants: Participant[];
  listingId: ListingRef;
  messages: MessageUI[];
  updatedAt: string;
};