import {
  Body,
  Controller,
  NotAcceptableException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateLandingDto } from './dto/createLandingPage.dto';
import { LandingpageService } from './landingpage.service';

@Controller('landingpage')
export class LandingpageController {
  constructor(private readonly landingPageService: LandingpageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async addData(
    @UploadedFile() file: Express.Multer.File,
    @Body() createLandingDto: CreateLandingDto,
  ): Promise<any> {
    if (!file) {
      throw new NotAcceptableException(
        'File is required to create landing page',
      );
    }
console.log(file, 'file,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,')
    createLandingDto.file = file;
    console.log(createLandingDto)
    const result =
      await this.landingPageService.addLandingPage(createLandingDto);
    return result;
  }
}
