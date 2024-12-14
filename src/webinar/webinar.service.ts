import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Webinar } from 'src/schemas/Webinar.schema';
import { CreateWebinarDto, UpdateWebinarDto } from './dto/createWebinar.dto';
import { ConfigService } from '@nestjs/config';
import { AttendeesService } from 'src/attendees/attendees.service';

@Injectable()
export class WebinarService {
  constructor(
    @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
    private readonly configService: ConfigService,
    private readonly attendeesService: AttendeesService
  ) {}

  async createWebiar(createWebinarDto: CreateWebinarDto): Promise<any> {
    //create webinar
    console.log(createWebinarDto);
    const result = await this.webinarModel.create(createWebinarDto);
    return result;
  }

  async getWebinars(
    adminId: string,
    page: number,
    limit: number,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const query = { adminId: new Types.ObjectId(`${adminId}`) };

    const totalWebinars = await this.webinarModel.countDocuments(query);

    const totalPages = Math.ceil(totalWebinars / limit);
    //get all webinars for adminas per user id
    const result = await this.webinarModel.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: 'attendees',
          localField: '_id',
          foreignField: 'webinar',
          as: 'attendees',
        },
      },
      {
        $project: {
          _id: 1,
          webinarName: 1,
          webinarDate: 1,
          adminId: 1,
          createdAt: 1,
          updatedAt: 1,
          totalAttendees: {
            $size: {
              $filter: {
                input: '$attendees',
                as: 'attendee',
                cond: { $eq: ['$$attendee.isAttended', true] },
              },
            },
          },
          totalRegistrations: {
            $size: {
              $filter: {
                input: '$attendees',
                as: 'attendee',
                cond: { $eq: ['$$attendee.isAttended', false] },
              },
            },
          },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
    return { result, page, totalPages };
  }

  async getWebinar(id: string, adminId: string): Promise<Webinar | null> {

    const result = await this.webinarModel.findOne({
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
    const pipeline = {
      _id: new Types.ObjectId(`${id}`),
      adminId: new Types.ObjectId(`${adminId}`),
    };

    const deletedWebinar = await this.webinarModel.findOneAndDelete(pipeline);
    const deletedAttendees = await this.attendeesService.deleteAttendees(
      id,
      adminId,
    );
    return { message: 'Webinar Deleted successfully', deletedWebinar, deletedAttendees };
  }
}
