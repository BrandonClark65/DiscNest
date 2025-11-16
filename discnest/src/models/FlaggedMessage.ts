import mongoose, { Schema, model, models } from "mongoose";

const FlaggedMessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    threadId: { type: Schema.Types.ObjectId, ref: "MessageThread", required: true },
    content: { type: String, required: true },
    categories: { type: Schema.Types.Mixed, default: {} }, // OpenAI categories
    status: {
      type: String,
      enum: ["pending", "delivered", "resolved", "rejected"],
      default: "pending",
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin
  },
  { timestamps: true }
);

const FlaggedMessage =
  models.FlaggedMessage || model("FlaggedMessage", FlaggedMessageSchema);

export default FlaggedMessage;
 