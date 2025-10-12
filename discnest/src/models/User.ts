// models/User.ts
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  password: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  discShelf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Disc' }],
  bag: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Disc' }],
  discCount: { type: Number, default: 0 },
  hasOnboarded: { type: Boolean, default: false },
  role: { type: String, default: 'user' },
  favoriteBrands: [String],
  preferredTypes: [String],
  stability: String,
  throwingStyle: String,
  maxDistance: Number,
  favoriteCourse: String,
  moderationFlags: { type: Number, default: 0 },
  lastFlaggedAt: { type: Date },

}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
