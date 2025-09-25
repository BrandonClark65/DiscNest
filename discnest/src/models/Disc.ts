import mongoose from 'mongoose';

const DiscSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String },
  type: { type: String }, // e.g., putter, midrange, driver
  stability: { type: String }, // e.g., overstable, stable, understable
  plastic: { type: String }, // optional, not in DiscIt API
  wearLevel: { type: Number, default: 0 }, // 0–100 scale
  notes: { type: String },

  flight: {
    speed: { type: Number },
    glide: { type: Number },
    turn: { type: Number },
    fade: { type: Number },
  },

  image: { type: String }, // URL to flight chart
  storeLink: { type: String }, // Marshall Street product page

  addedAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional for user-owned discs
});

export default mongoose.models.Disc || mongoose.model('Disc', DiscSchema);