import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tag, Usecase } from 'src/schemas/tags.schema';
import { CreateTagDto } from './dto/tags.dto';

@Injectable()
export class TagsService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<Tag>) {}

  async createTag(
    createTagDto: CreateTagDto,
    adminId: Types.ObjectId,
  ): Promise<Tag> {
    const sanitizedName = createTagDto.name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    const existingTag = await this.tagModel.findOne({
      name: sanitizedName,
      adminId,
    });

    if (existingTag) {
      throw new BadRequestException('Tag already exists');
    }

    const tag = new this.tagModel({
      name: sanitizedName,
      usecase: createTagDto.usecase,
      adminId,
    });

    return await tag.save();
  }

  async getTags(
    adminId: Types.ObjectId,
    usecase?: Usecase | undefined,
  ): Promise<Tag[]> {
    const query = { adminId };
    if (usecase) {
      console.log(usecase);
      query['usecase'] = usecase;
    }
    return this.tagModel.find(query).sort({ createdAt: -1 });
  }
}
