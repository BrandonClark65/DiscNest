import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],

  // Moderation fields
  flagged: { type: Boolean, default: false },
  flaggedCategories: { type: Object, default: {} },
});

const MessageThreadSchema = new Schema({
  participants: [
    { type: Schema.Types.ObjectId, ref: "User", required: true }
  ],
  listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: false },
  requestId: { type: Schema.Types.ObjectId, ref: "DiscRequest", required: false },

  messages: [MessageSchema], 

  updatedAt: { type: Date, default: Date.now },
});

// Ensure unique conversation per listing + participants pair
MessageThreadSchema.index({ participants: 1, listingId: 1 });

const MessageThread =
  models.MessageThread || model("MessageThread", MessageThreadSchema);

export default MessageThread;
