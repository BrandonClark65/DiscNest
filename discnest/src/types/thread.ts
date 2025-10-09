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