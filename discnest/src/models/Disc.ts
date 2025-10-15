// models/Disc.ts
import mongoose from 'mongoose';

const DiscSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String },
  type: { type: String, default: '' },
  stability: { type: String, default: '' },
  plastic: { type: String, default: '' },
  wearLevel: { type: Number, min: 0, max: 100, default: 0 }, // changed to number 0-100
  weight: { type: Number, default: null }, // in grams
  notes: { type: String, default: '' },
  color: { type: String, default: '#ffffff' },
  flight: {
    speed: { type: Number },
    glide: { type: Number },
    turn: { type: Number },
    fade: { type: Number },
  },
  image: { type: String },
  storeLink: { type: String },
  addedAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.models.Disc || mongoose.model('Disc', DiscSchema);
