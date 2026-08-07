import { MongoMemoryServer } from 'mongodb-memory-server';

let instance: MongoMemoryServer | null = null;

/**
 * Start an in-memory MongoDB server. Used as an automatic dev fallback when no
 * real MongoDB is reachable. Data is ephemeral — it resets on restart.
 */
export async function startMemoryDb(): Promise<string> {
  if (!instance) {
    instance = await MongoMemoryServer.create();
  }
  return instance.getUri();
}

export async function stopMemoryDb() {
  if (instance) {
    await instance.stop();
    instance = null;
  }
}
