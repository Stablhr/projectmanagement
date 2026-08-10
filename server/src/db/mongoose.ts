import mongoose from 'mongoose';
import { env } from '../config/env';
import { startMemoryDb, stopMemoryDb } from './memoryDb';

const LOCAL_FALLBACK_URI = 'mongodb://localhost:27017/trello-clone';

/**
 * Connect to the configured MongoDB, falling back to a local instance and
 * finally to an in-memory MongoDB so the app always boots even when the
 * configured database is unreachable. In-memory data is ephemeral.
 */
export async function connectDb() {
  const uris = [env.mongodbUri];
  if (env.mongodbUri !== LOCAL_FALLBACK_URI) {
    uris.push(LOCAL_FALLBACK_URI);
  }

  for (const uri of uris) {
    try {
      await mongoose.connect(uri);
      console.log(`[db] connected to ${uri}`);
      return;
    } catch (err) {
      console.warn(
        `[db] could not connect to "${uri}" (${(err as Error).message.split('\n')[0]})`,
      );
    }
  }

  const uri = await startMemoryDb();
  await mongoose.connect(uri);
  console.warn('[db] using in-memory MongoDB — data resets on restart');
}

export async function disconnectDb() {
  await mongoose.disconnect();
  await stopMemoryDb();
}
