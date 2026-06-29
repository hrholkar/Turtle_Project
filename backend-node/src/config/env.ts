import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try multiple candidate locations for .env — works both in ts-node-dev and compiled dist/
const envCandidates = [
  path.resolve(__dirname, '../../.env'),       // from src/config → backend-node/.env
  path.resolve(__dirname, '../../../.env'),     // from src/config → project root .env
  path.resolve(process.cwd(), '.env'),          // CWD (backend-node/.env when npm run dev)
  path.resolve(process.cwd(), '../.env'),       // CWD parent (project root)
];

const envFile = envCandidates.find(p => fs.existsSync(p));
if (envFile) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config(); // fallback: let dotenv look in CWD
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/turtletrack',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  // UPLOAD_DIR: prefer env var (../uploads relative to backend-node/), then absolute fallback to project root
  UPLOAD_DIR: process.env.UPLOAD_DIR
    ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
    : path.resolve(__dirname, '../../../uploads'),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  STORAGE_ADAPTER: (process.env.STORAGE_ADAPTER || 'local') as 'local' | 's3' | 'cloudinary',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
} as const;
