import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

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

async function getClient() {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error(
      "MONGO_URI is not defined. Add it in Vercel → Settings → Environment Variables, then redeploy."
    );
  }

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    globalForMongo._mongoClientPromise = client.connect().catch((err) => {
      globalForMongo._mongoClientPromise = undefined;
      throw err;
    });
  }

  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db();
}
