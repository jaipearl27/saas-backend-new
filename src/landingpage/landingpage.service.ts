import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandingPage } from 'src/schemas/LandingPage.schema';
import { CreateLandingDto } from './dto/createLandingPage.dto';
import * as fs from 'fs';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class LandingpageService {
  constructor(
    @InjectModel(LandingPage.name) private landingPageModel: Model<LandingPage>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getLandingPage(): Promise<any> {
    const result = await this.landingPageModel.find({});

    return result[0];
  }

  async addLandingPage(
    createLandingDto: CreateLandingDto,
    file: Express.Multer.File,
  ): Promise<any> {
    console.log(file);

    if (file) {
      if (file.mimetype.includes('image')) {
        const response = await this.cloudinaryService.uploadImage(
          file.path,
          'landingpage',
        );
        fs.unlinkSync(file.path);
        if (!response) {
          throw new NotAcceptableException('Failed to upload image');
        }
        createLandingDto.file = response;
      } else {
        createLandingDto.file = file;
      }
    } else {
      delete createLandingDto.file;
    }
    

    const existingLandingPage = await this.landingPageModel.findOne();
    console.log('file exists cheack -----> ', createLandingDto);
    if (existingLandingPage) {
      console.log(existingLandingPage);
      if (createLandingDto?.file) {
        if (existingLandingPage?.file?.public_id) {
          await this.cloudinaryService.deleteFile(
            existingLandingPage.file.public_id,
            'landingpage',
          );
        } else if (existingLandingPage?.file?.path) {
          fs.unlinkSync(existingLandingPage.file.path);
        }
      }

      const updatedData = await this.landingPageModel.findByIdAndUpdate(
        existingLandingPage._id,
        createLandingDto,
        { new: true },
      );
      return updatedData;
    }

    if (!createLandingDto.file) {
      throw new Error('File is required to create a new landing page.');
    }

    const newLandingPage = await this.landingPageModel.create(createLandingDto);
    return [];
  }
}
