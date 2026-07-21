import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function getMongoUri() {
  return (
    process.env.MONGO_URI?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    ""
  );
}

export function hasMongoUri() {
  return Boolean(getMongoUri());
}

export async function connectDB() {
  const uri = getMongoUri();

  if (!uri) {
    throw new Error(
      "MONGO_URI is not defined. Add it in Vercel → Settings → Environment Variables, then redeploy."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}
