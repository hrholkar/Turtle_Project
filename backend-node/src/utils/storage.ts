import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

export type StorageFolder = 'turtles' | 'sightings' | 'temporary';

/**
 * Storage Adapter Interface — supports local and future S3
 */
export interface StorageAdapter {
  getFilePath(folder: StorageFolder, filename: string): string;
  getPublicUrl(folder: StorageFolder, filename: string): string;
  deleteFile(folder: StorageFolder, filename: string): Promise<void>;
  fileExists(folder: StorageFolder, filename: string): Promise<boolean>;
}

/**
 * Local filesystem storage adapter
 */
export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || env.UPLOAD_DIR;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const folders: StorageFolder[] = ['turtles', 'sightings', 'temporary'];
    for (const folder of folders) {
      const dir = path.join(this.baseDir, folder);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  getFilePath(folder: StorageFolder, filename: string): string {
    return path.join(this.baseDir, folder, filename);
  }

  getPublicUrl(folder: StorageFolder, filename: string): string {
    return `/uploads/${folder}/${filename}`;
  }

  async deleteFile(folder: StorageFolder, filename: string): Promise<void> {
    const filePath = this.getFilePath(folder, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async fileExists(folder: StorageFolder, filename: string): Promise<boolean> {
    const filePath = this.getFilePath(folder, filename);
    return fs.existsSync(filePath);
  }

  moveFile(fromFolder: StorageFolder, toFolder: StorageFolder, filename: string): string {
    const src = this.getFilePath(fromFolder, filename);
    const dst = this.getFilePath(toFolder, filename);
    fs.renameSync(src, dst);
    return dst;
  }
}

/**
 * S3 Storage Adapter — STUB for future cloud migration
 * Implement by filling in AWS SDK calls below.
 */
export class S3StorageAdapter implements StorageAdapter {
  constructor(_config?: Record<string, string>) {
    // TODO: Initialize AWS S3 client
    // const s3 = new S3Client({ region: config.region });
    console.warn('[Storage] S3StorageAdapter is a stub — not implemented yet.');
  }

  getFilePath(_folder: StorageFolder, _filename: string): string {
    throw new Error('S3StorageAdapter.getFilePath() not implemented');
  }

  getPublicUrl(folder: StorageFolder, filename: string): string {
    const bucket = process.env.S3_BUCKET_NAME || 'turtletrack-uploads';
    const region = process.env.S3_REGION || 'us-east-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${folder}/${filename}`;
  }

  async deleteFile(_folder: StorageFolder, _filename: string): Promise<void> {
    throw new Error('S3StorageAdapter.deleteFile() not implemented');
  }

  async fileExists(_folder: StorageFolder, _filename: string): Promise<boolean> {
    throw new Error('S3StorageAdapter.fileExists() not implemented');
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────
export const storage: StorageAdapter =
  env.STORAGE_ADAPTER === 's3'
    ? new S3StorageAdapter()
    : new LocalStorageAdapter();
