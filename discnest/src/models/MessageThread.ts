import mongoose, { Schema, model, models } from "mongoose";

const MessageThreadSchema = new Schema({
  participants: [
    { type: Schema.Types.ObjectId, ref: "User", required: true }
  ],
  listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  messages: [
    {
      sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

MessageThreadSchema.index({ participants: 1, listingId: 1 });

const MessageThread = models.MessageThread || model("MessageThread", MessageThreadSchema);
export default MessageThread;
