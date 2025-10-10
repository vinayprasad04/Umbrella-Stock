import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_CONNECTION_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_CONNECTION_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;

    // Initialize cron job after successful connection (server-side only)
    if (typeof window === 'undefined') {
      try {
        require('./cron/init-on-startup');
      } catch (error) {
        console.log('Note: Cron initialization skipped (expected during build)');
      }
    }
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;