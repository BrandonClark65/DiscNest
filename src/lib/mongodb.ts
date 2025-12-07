import mongoose from 'mongoose';
import "@/models";
import { validateEnv } from './env';

// Validate environment variables on module load
// This ensures we catch missing variables early
if (typeof window === 'undefined') {
  // Only validate on server-side
  try {
    validateEnv();
  } catch (error) {
    // In development, show helpful error
    if (process.env.NODE_ENV === 'development') {
      console.error('\n❌ Environment validation failed. Please check your .env.local file.\n');
    }
    throw error;
  }
}

const MONGODB_URI = process.env.MONGODB_URI!;

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use a global cache in dev to avoid creating multiple connections
let cached: Cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

