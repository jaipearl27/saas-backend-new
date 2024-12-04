import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Webinar } from 'src/schemas/Webinar.schema';
import { CreateWebinarDto, UpdateWebinarDto } from './dto/createWebinar.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebinarService {
  constructor(
    @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
    private readonly configService: ConfigService,
  ) {}

  async createWebiar(createWebinarDto: CreateWebinarDto): Promise<any> {
    //create webinar
    console.log(createWebinarDto);
    const result = await this.webinarModel.create(createWebinarDto);
    return result;
  }

  async getWebinars(adminId: string, page, limit): Promise<any> {
    const skip = (page - 1) * limit;

    const pipeline = { adminId: new Types.ObjectId(`${adminId}`) }

    const totalWebinars = await this.webinarModel.countDocuments(pipeline)

    const totalPages = Math.ceil(totalWebinars / limit)
    //get all webinars for adminas per user id
    const result = await this.webinarModel
      .find(pipeline)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
    return {result, page, totalPages};
  }

  async getWebinar(id: string, adminId: string): Promise<any> {
    //get all webinars as per user id

    const result = await this.webinarModel.find({
      _id: new Types.ObjectId(`${id}`),
      adminId: new Types.ObjectId(`${adminId}`),
    });
    return result;
  }

  async updateWebinar(
    id: string,
    adminId: string,
    updateWebinarDto: UpdateWebinarDto,
  ): Promise<any> {
    //update webinar
    console.log(id, adminId);
    const result = await this.webinarModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      },
      updateWebinarDto,
    );
    return result;
  }

  async deleteWebinar(id: string, adminId: string): Promise<any> {
    //update webinar
    const result = await this.webinarModel.findOneAndDelete({
      _id: new Types.ObjectId(`${id}`),
      adminId: new Types.ObjectId(`${adminId}`),
    });

    //logic for deleting webinar's attendees when webinar is deleted

    return { message: 'Webinar Deleted successfully' };
  }
}
