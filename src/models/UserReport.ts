import { Schema, model, models } from "mongoose";

const UserReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", required: true },

    threadId: { type: Schema.Types.ObjectId, ref: "MessageThread" },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing" },
    requestId: { type: Schema.Types.ObjectId, ref: "DiscRequest" }, // ← NEW

    reason: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.UserReport || model("UserReport", UserReportSchema);
