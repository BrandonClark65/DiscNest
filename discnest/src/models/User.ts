import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  password: String, // hashed password for credentials login
  createdAt: { type: Date, default: Date.now },
  discShelf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Disc' }],
  bag: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Disc' }],
  hasOnboarded: { type: Boolean, default: false },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);