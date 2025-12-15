import { Schema, model, models } from "mongoose";
import { DiscBrands, DiscPlastics } from "@/app/constants/discData";

const ListingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // discId: { type: Schema.Types.ObjectId, ref: "Disc", required: false }, // from bag
  title: { type: String, required: true },
  description: String,

  // ✅ Restrict to known brands & plastics from discData
  brand: { type: String, enum: DiscBrands, required: false },
  plastic: { type: String, enum: DiscPlastics, required: false },

  condition: { 
    type: String, 
    enum: ["New", "Like New", "Used", "Worn"], 
    required: true 
  },

  type: { type: String, enum: ["Sell", "Trade"], required: true },
  price: Number,
  imageUrls: [String],
  publicIds: [String],
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: false }, // [lng, lat]
  },
  city: String,
  state: String,
  radiusVisibility: { type: Number, default: 5 }, // miles
  createdAt: { type: Date, default: Date.now },
  pendingReview: { type: Boolean, default: false },
  sold: { type: Boolean, default: false },
  weight: { type: Number, default: null }, // in grams
  color: { type: String, required: false }, // optional color description
});

ListingSchema.index({ location: "2dsphere" }); // enable geo queries

// Pre-save hook: remove location if it doesn't have valid coordinates
ListingSchema.pre("save", function (next) {
  if (this.location && (!this.location.coordinates || this.location.coordinates.length !== 2)) {
    this.location = undefined;
  }
  next();
});

const Listing = models.Listing || model("Listing", ListingSchema);
export default Listing;
