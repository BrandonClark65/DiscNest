import { Schema, model, models } from "mongoose";

const RatingSchema = new Schema(
  {
    // Who is being rated
    ratedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Who is giving the rating
    raterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The rating value (1-5 stars)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Optional review text
    review: {
      type: String,
      maxlength: 500,
    },

    // What interaction this rating is for
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "DiscRequest",
    },

    // Timestamp
    createdAt: { type: Date, default: Date.now },

    // Optional: mark if this was a buyer or seller rating
    role: {
      type: String,
      enum: ["buyer", "seller"],
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate ratings for the same interaction
// A user can only rate another user once per listing/request
RatingSchema.index(
  { raterUserId: 1, ratedUserId: 1, listingId: 1 },
  { unique: true, sparse: true }
);
RatingSchema.index(
  { raterUserId: 1, ratedUserId: 1, requestId: 1 },
  { unique: true, sparse: true }
);

// Index for efficient queries
RatingSchema.index({ ratedUserId: 1, createdAt: -1 });

export default models.Rating || model("Rating", RatingSchema);

