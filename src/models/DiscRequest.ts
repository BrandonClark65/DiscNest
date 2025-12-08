import { Schema, model, models } from "mongoose";
import { DiscBrands, DiscPlastics } from "@/app/constants/discData";

const DiscRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  // What they want to buy
  title: { type: String, required: true },
  description: String,

  brand: { type: String, enum: DiscBrands },
  plastic: { type: String, enum: DiscPlastics },
  weight: Number,
  color: String,
  condition: { type: String, enum: ["New", "Like New", "Used", "Worn"] },

  // For radius sorting
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },

  createdAt: { type: Date, default: Date.now },
});

DiscRequestSchema.index({ location: "2dsphere" });

export default models.DiscRequest || model("DiscRequest", DiscRequestSchema);
