import { Schema, model, models } from "mongoose";
import { ROUND_SOURCES, ROUND_TYPES } from "@/app/constants/handicapConfig";

/**
 * One round a player entered toward their DiscNest handicap.
 *
 * Course and layout are free text on purpose - DiscNest has no course
 * database yet. When one is added these become foreign keys and `ssa` starts
 * being derived from the community's own scores instead of supplied.
 */
const HandicapRoundSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Where the rating for this round came from
    source: {
      type: String,
      enum: ROUND_SOURCES,
      required: true,
    },

    // Free-text course identification
    courseName: { type: String, trim: true, maxlength: 120 },
    layoutName: { type: String, trim: true, maxlength: 120 },

    date: { type: Date, required: true, index: true },
    holes: { type: Number, default: 18 },

    // Raw entry - which of these are set depends on `source`
    score: { type: Number },
    par: { type: Number },
    ssa: { type: Number },
    providedRating: { type: Number },

    // Derived server-side by handicapUtils.roundRating
    computedRating: { type: Number, required: true },
    estimated: { type: Boolean, default: false },

    roundType: {
      type: String,
      enum: ROUND_TYPES,
      default: "casual",
    },

    // DNF rounds are excluded from the rating, matching PDGA
    completed: { type: Boolean, default: true },

    notes: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

// The rating query is always "this user's rounds, newest first"
HandicapRoundSchema.index({ userId: 1, date: -1 });

export default models.HandicapRound || model("HandicapRound", HandicapRoundSchema);
