import mongoose from 'mongoose';
import { config } from '@/config/index';

let isConnected = false;

export async function connectDb(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(config.MONGODB_URI, {
    dbName: config.MONGODB_DB_NAME,
  });
  isConnected = conn.connection.readyState === 1;
  return conn;
}

export async function disconnectDb(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}