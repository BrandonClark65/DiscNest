import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  password: String, // hashed password for credentials login

  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null }, 

  discShelf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Disc' }],
  bag: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Disc' }],
  discCount: { type: Number, default: 0 }, // ✅ for badge logic

  hasOnboarded: { type: Boolean, default: false },
  role: { type: String, default: 'user' }, // 'user' or 'admin'

  // ✅ Profile preferences
  favoriteBrands: [String],
  preferredTypes: [String],
  stability: String,
  throwingStyle: String,
  maxDistance: Number,
  favoriteCourse: String,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);