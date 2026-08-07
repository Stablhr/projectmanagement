import mongoose from 'mongoose';
import { env, isDev } from '../config/env';
import { startMemoryDb, stopMemoryDb } from './memoryDb';

export async function connectDb() {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log(`[db] connected to ${env.mongodbUri}`);
  } catch (err) {
    if (!isDev()) {
      throw err;
    }
    console.warn(
      `[db] could not connect to "${env.mongodbUri}" (${(err as Error).message.split('\n')[0]})`,
    );
    const uri = await startMemoryDb();
    await mongoose.connect(uri);
    console.log(
      '[db] using in-memory MongoDB (data resets on restart)',
    );
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
  await stopMemoryDb();
}
