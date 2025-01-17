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
    folderName: string = 'notes-images',
  ): Promise<UploadApiErrorResponse | UploadApiResponse> {
    console.log(
      'cloudinary service',
      process.env.CLOUDINARY_CLOUD_NAME,
      process.env.CLOUDINARY_API_KEY,
      process.env.CLOUDINARY_API_SECRET,
    );

    return new Promise((resolve, reject) => {
      v2.uploader.upload(filePath, { folder: folderName }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  async deleteFile(public_id: string, folder?: string) {
    const fullId = folder ? `${folder}/${public_id}` : public_id;
    return new Promise((resolve, reject) => {
      v2.uploader.destroy(fullId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
