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

  async addLandingPage(createLandingDto: CreateLandingDto): Promise<any> {
    const oldData: any[] = await this.landingPageModel.find();

    if (oldData.length > 0) {
      const filePath = oldData[0].file.path;
      // Remove the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error removing file: ${err}`);
          return;
        }
        console.log(`File ${filePath} has been successfully removed.`);
      });

      const updateData = await this.landingPageModel.findByIdAndUpdate(
        oldData[0]._id,
        createLandingDto,
      );
      return updateData;
    } else {
      const createData = await this.landingPageModel.create(createLandingDto);
      return createData;
    }
  }
}
