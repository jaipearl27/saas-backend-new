import {
  Body,
  Controller,
  Get,
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

  @Get()
  async getLandingPage() {
    const result = await this.landingPageService.getLandingPage()
    return result
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async addData(
    @UploadedFile() file: Express.Multer.File,
    @Body() createLandingDto: CreateLandingDto,
  ): Promise<any> {
    if (file) {
      createLandingDto.file = file;
    }
    else{
      createLandingDto.file = null;
    }
    

    const result =
      await this.landingPageService.addLandingPage(createLandingDto);
    return result;
  }
}
