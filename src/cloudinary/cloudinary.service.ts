import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    filePath: string,
  ): Promise<UploadApiErrorResponse | UploadApiResponse> {
    console.log('cloudinary service', process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET);

    return new Promise((resolve, reject) => {
      v2.uploader.upload(
        filePath,
        { folder: 'notes-images' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
    });
  }
}
