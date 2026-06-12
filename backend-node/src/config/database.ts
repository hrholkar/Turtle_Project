import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[DB] MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[DB] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('[DB] MongoDB reconnected');
});
