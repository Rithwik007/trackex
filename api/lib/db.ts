import mongoose from 'mongoose';


const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI env var not set');
}

// Global cache to prevent reconnect on every serverless invocation
declare global {
  // eslint-disable-next-line no-var
  var _mongoConn: typeof mongoose | null;
}

let cached: typeof mongoose | null = global._mongoConn ?? null;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached && cached.connection.readyState === 1) {
    return cached;
  }

  cached = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  global._mongoConn = cached;
  return cached;
}
