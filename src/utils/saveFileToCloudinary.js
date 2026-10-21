import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import { env } from './env.js';

export const saveFileToCloudinary = async (file) => {
  if (!file) return null;

  cloudinary.config({
    cloud_name: env('CLOUDINARY_CLOUD_NAME'),
    api_key: env('CLOUDINARY_API_KEY'),
    api_secret: env('CLOUDINARY_API_SECRET'),
  });

  try {
    const response = await cloudinary.uploader.upload(file.path, {
      folder: 'contacts',
    });

    await fs.unlink(file.path);

    return response.secure_url;
  } catch (error) {
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error('Failed to delete temp file:', unlinkError);
    }
    throw error;
  }
};
