import mongoose from "mongoose";
import { DiscBrands, DiscPlastics } from "@/app/constants/discData";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },

    avatarUrl: String,
    avatarPublicId: String,
    bio: String,

    // 🔥 Credentials users ONLY (OAuth users won't have this)
    password: { type: String, required: false },

    // 🔑 Password reset fields
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },

    // 🔥 OAuth Support
    provider: { type: String, enum: ["google", "facebook", "credentials"], default: "credentials" },
    providerId: { type: String, default: null }, // Google/Facebook user ID

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number],
    },

    // ---- Disc Golf Info ----
    pdgaNumber: Number,
    homeCourse: String,
    favoriteCourses: [String],
    maxDistanceFt: Number,
    goals: String,

    // ---- Play Style ----
    dominantHand: { type: String, enum: ["Left", "Right", "Both"] },
    throwStyle: { type: String, enum: ["Backhand", "Forehand", "Both"] },

    favoriteBrands: [
      { type: String, enum: DiscBrands as unknown as string[] },
    ],

    preferredDiscTypes: [
      {
        type: String,
        enum: ["Putter", "Midrange", "Fairway Driver", "Distance Driver"],
      },
    ],

    stabilityPreference: {
      type: String,
      enum: ["Straight", "Overstable", "Understable"],
    },

    armSpeed: { type: String, enum: ["Slow", "Medium", "Fast"] },
    skillLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Pro"] },
    playFrequency: { type: String, enum: ["<1 per week", "1-2 times per week", "Every day"] },

    preferredPlastics: [
      { type: String, enum: DiscPlastics as unknown as string[] },
    ],

    // ---- Meta ----
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: null },
    hasOnboarded: { type: Boolean, default: false },
    role: { type: String, default: "user" },
    moderationFlags: { type: Number, default: 0 },
    lastFlaggedAt: Date,

    // ---- Store Fields ----
    storeName: { type: String, unique: true, sparse: true }, // Unique store name for URL slug

    // ---- Discs ----
    discShelf: [{ type: mongoose.Schema.Types.ObjectId, ref: "Disc" }],
    bag: [{ type: mongoose.Schema.Types.ObjectId, ref: "Disc" }],

    shareableBagId: { type: String, unique: true, sparse: true },
    bagVisibility: { type: String, enum: ["private", "public"], default: "private" },
    discCount: { type: Number, default: 0 },

    // ---- Ratings ----
    averageRating: { type: Number, default: null }, // null if no ratings yet
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Pre-save hook: remove location if it doesn't have valid coordinates
UserSchema.pre("save", function (next) {
  if (this.location && (!this.location.coordinates || this.location.coordinates.length !== 2)) {
    this.location = undefined;
  }
  next();
});

// Create geo index for location queries
UserSchema.index({ location: "2dsphere" });

export default mongoose.models.User || mongoose.model("User", UserSchema);
