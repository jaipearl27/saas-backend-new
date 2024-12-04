import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandingPage } from 'src/schemas/LandingPage.schema';
import { CreateLandingDto } from './dto/createLandingPage.dto';
import * as fs from 'fs';

@Injectable()
export class LandingpageService {
  constructor(
    @InjectModel(LandingPage.name) private landingPageModel: Model<LandingPage>,
  ) {}

  async getLandingPage(): Promise<any> {
    const result = await this.landingPageModel.find({});

    return result[0];
  }

  async addLandingPage(createLandingDto: CreateLandingDto): Promise<any> {
    const existingLandingPage = await this.landingPageModel.findOne();
    console.log('file exists cheack -----> ', createLandingDto)
    if (existingLandingPage) {
      if (createLandingDto.file) {
        console.log('file exists')
        try {
          const oldFilePath = existingLandingPage.file.path;
          await fs.promises.unlink(oldFilePath);
          console.log(`File ${oldFilePath} has been successfully removed.`);
        } catch (error) {
          console.error(`Error removing file: ${error.message}`);
          // throw new Error('Failed to remove the old file.');
        }
      } else {
        console.log('file not exists')

        delete createLandingDto.file;
      }
      console.log('file exists cheack -----> ', createLandingDto)

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
    return newLandingPage;
  }
}
