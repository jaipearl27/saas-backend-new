import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Id } from 'src/decorators/custom.decorator';
import { WebinarService } from './webinar.service';
import { CreateWebinarDto, UpdateWebinarDto } from './dto/createWebinar.dto';
@Controller('webinar')
export class WebinarController {
  constructor(
    private readonly webinarService: WebinarService,
  ) {}

  @Get()
  async getWebinars(
    @Id() adminId: string,
    @Query() query: { page: string; limit: string },
  ): Promise<any> {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;

    const result = await this.webinarService.getWebinars(adminId, page, limit);
    return result;
  }

  @Get(':id')
  async getWebinar(
    @Id() adminId: string,
    @Param('id') id: string,
  ): Promise<any> {
    const result = await this.webinarService.getWebinar(id, adminId);
    return result;
  }

  @Post()
  async createWebinar(
    @Id() adminId: string,
    @Body() createWebinarDto: CreateWebinarDto,
  ): Promise<any> {
    createWebinarDto.adminId = adminId;
    const result = await this.webinarService.createWebiar(createWebinarDto);
    return result;
  }

  @Patch(':id')
  async updateWebinar(
    @Id() adminId: string,
    @Param('id') id: string,
    @Body() updateWebinarDto: UpdateWebinarDto,
  ): Promise<any> {
    const result = await this.webinarService.updateWebinar(
      id,
      adminId,
      updateWebinarDto,
    );
    return result;
  }

  @Delete(':id')
  async deleteWebinar(
    @Id() adminId: string,
    @Param('id') id: string,
  ): Promise<any> {
    const result = await this.webinarService.deleteWebinar(id, adminId);
    return result;
  }
}
