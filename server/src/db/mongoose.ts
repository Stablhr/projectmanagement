import mongoose from 'mongoose';
import { env } from '../config/env';

export async function connectDb() {
  await mongoose.connect(env.mongodbUri);
  console.log(`[db] connected to ${env.mongodbUri}`);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
