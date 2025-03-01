import { Controller, Post, Body, Get, UseGuards, Query } from '@nestjs/common';
import { CreateTagDto } from './dto/tags.dto';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { TagsService } from './tags.service';
import { Types } from 'mongoose';
import { Usecase } from 'src/schemas/tags.schema';
@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Post()
  async createTag(@Body() createTagDto: CreateTagDto, @Id() adminId: string) {
    const tag = await this.tagsService.createTag(
      createTagDto,
      new Types.ObjectId(`${adminId}`),
    );
    return {
      success: true,
      message: 'Tag created successfully',
      data: tag,
    };
  }

  @Get()
  async getTags(
    @AdminId() adminId: string,
    @Query('usecase') usecase: Usecase | undefined,
  ) {
    const tags = await this.tagsService.getTags(
      new Types.ObjectId(`${adminId}`),
      usecase,
    );
    return {
      success: true,
      message: 'Tags fetched successfully',
      data: tags,
    };
  }
}
