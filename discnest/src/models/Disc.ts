import mongoose from 'mongoose';

const DiscSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String },
  type: { type: String }, // e.g., putter, driver
  stability: { type: String },
  plastic: { type: String },
  wearLevel: { type: Number, default: 0 }, // 0–100 scale
  addedAt: { type: Date, default: Date.now },
  notes: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.models.Disc || mongoose.model('Disc', DiscSchema);