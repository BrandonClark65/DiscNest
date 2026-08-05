import { Schema, model, models } from "mongoose";

/**
 * A point-in-time record of a player's handicap, so progress can be charted.
 *
 * Written manually when the player clicks save, and automatically whenever a
 * round change moves their rating. See src/lib/handicap/handicapService.ts.
 */
const HandicapSnapshotSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: { type: Number, required: true },
    handicapThrows: { type: Number },
    targetRating: { type: Number, default: 1000 },

    sampleSize: { type: Number, default: 0 },
    provisional: { type: Boolean, default: true },

    trigger: {
      type: String,
      enum: ["manual", "auto"],
      default: "auto",
    },

    note: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

// Chart queries read this user's snapshots in time order
HandicapSnapshotSchema.index({ userId: 1, createdAt: -1 });

export default models.HandicapSnapshot ||
  model("HandicapSnapshot", HandicapSnapshotSchema);
