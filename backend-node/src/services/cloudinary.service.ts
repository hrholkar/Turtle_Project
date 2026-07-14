import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Uploads a local file to Cloudinary and returns the secure URL.
   * @param localFilePath Absolute path to the file on disk
   * @param folder Optional folder name in Cloudinary
   * @returns The secure URL (https) of the uploaded image
   */
  static async uploadImage(localFilePath: string, folder: string = 'turtletrack'): Promise<string> {
    try {
      if (!env.CLOUDINARY_CLOUD_NAME) {
        throw new Error('Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME.');
      }
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder,
        resource_type: 'image',
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }
}
