import mongoose, { Schema, model, models } from "mongoose";

const ListingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // discId: { type: Schema.Types.ObjectId, ref: "Disc", required: false }, // from bag
  title: { type: String, required: true },
  description: String,
  brand: String,
  condition: { type: String, enum: ["New", "Used - Like New", "Used - Fair"], required: true },
  type: { type: String, enum: ["Sell", "Trade"], required: true },
  price: Number,
  imageUrls: [String],
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  city: String,
  radiusVisibility: { type: Number, default: 5 }, // miles
  createdAt: { type: Date, default: Date.now },
  pendingReview: { type: Boolean, default: false },
  plastic: { type: String, default: '' },
});

ListingSchema.index({ location: "2dsphere" }); // enable geo queries

const Listing = models.Listing || model("Listing", ListingSchema);
export default Listing;
