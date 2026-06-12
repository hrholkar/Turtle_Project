import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/turtletrack',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  STORAGE_ADAPTER: (process.env.STORAGE_ADAPTER || 'local') as 'local' | 's3',
} as const;
