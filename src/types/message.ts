import { Types } from "mongoose";
import mongoose from "mongoose";

export type Message = {
  sender: Types.ObjectId;       // matches Mongoose schema
  content: string;
  timestamp: Date;
  readBy: Types.ObjectId[];  
  flagged?: boolean;
  flaggedCategories?: Record<string, boolean>;   // array of ObjectIds
};

// frontend type (UI)
export type MessageUI = {
  sender: { _id: string; name: string };
  content: string;
  timestamp: Date;
  readBy: string[];
  flagged?: boolean;
  flaggedCategories?: Record<string, boolean>;
};

// backend type (DB)
export type MessageDB = {
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  readBy: mongoose.Types.ObjectId[];
  flagged?: boolean;
  flaggedCategories?: Record<string, boolean>;
};
