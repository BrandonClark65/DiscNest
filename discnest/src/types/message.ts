import { DiscNestUser as User } from "./user";

export type Message = {
  sender: User;
  content: string;
  timestamp: string;
};