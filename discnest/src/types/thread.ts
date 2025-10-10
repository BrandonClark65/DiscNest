import { DiscNestUser as User } from "./user";
import { Listing } from "./listing";
import { Message } from "./message";

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