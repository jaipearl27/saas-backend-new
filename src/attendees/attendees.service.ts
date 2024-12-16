import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Attendee } from 'src/schemas/Attendee.schema';
import {
  AttendeesFilterDto,
  CreateAttendeeDto,
  UpdateAttendeeDto,
} from './dto/attendees.dto';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
  ) {}

  async addAttendees(attendees: [CreateAttendeeDto]): Promise<any> {
    const result = await this.attendeeModel.insertMany(attendees);
    return result;
  }

  async getAttendees(
    webinarId: string,
    AdminId: string,
    isAttended: boolean,
    page: number,
    limit: number,
    filters: AttendeesFilterDto = {},
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [
      // Step 1: Match key fields to reduce dataset size
      {
        $match: {
          adminId: new Types.ObjectId(AdminId),
          isAttended: isAttended,
          ...(webinarId &&
            webinarId !== '' && { webinar: new Types.ObjectId(webinarId) }),
        },
      },
      // Step 2: Conditionally include a lookup for webinarName if webinarId is empty
      ...(webinarId === ''
        ? [
            {
              $lookup: {
                from: 'webinars', // Replace with the actual webinar collection name
                localField: 'webinar',
                foreignField: '_id',
                as: 'webinarDetails',
              },
            },
            {
              $addFields: {
                webinarName: {
                  $arrayElemAt: ['$webinarDetails.webinarName', 0],
                }, // Extract webinarName
              },
            },
            {
              $project: { webinarDetails: 0 }, // Remove the webinarDetails array if it's no longer needed
            },
          ]
        : []),
      // Step 3: Apply optional filters
      {
        $match: {
          ...(filters.email && {
            email: { $regex: filters.email, $options: 'i' },
          }),
          ...(filters.firstName && {
            firstName: { $regex: filters.firstName, $options: 'i' },
          }),
          ...(filters.lastName && {
            lastName: { $regex: filters.lastName, $options: 'i' },
          }),
          ...(filters.gender && {
            gender: { $regex: filters.gender, $options: 'i' },
          }),
          ...(filters.phone && {
            phone: { $regex: filters.phone, $options: 'i' },
          }),
          ...(filters.location && {
            location: { $regex: filters.location, $options: 'i' },
          }),
          ...(filters.timeInSession && {
            timeInSession: filters.timeInSession,
          }),
        },
      },
      // Step 4: Faceted query for pagination and total count
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $sort: { email: 1 } }, { $skip: skip }, { $limit: limit }],
        },
      },
      // Step 5: Unwind metadata to extract total count and calculate total pages
      { $unwind: '$metadata' },
      {
        $project: {
          totalPages: { $ceil: { $divide: ['$metadata.total', limit] } },
          page: page,
          result: '$data',
        },
      },
    ];

    const aggregationResult = await this.attendeeModel
      .aggregate(pipeline)
      .exec();

    if (aggregationResult.length === 0) {
      return { totalPages: 0, page: page, result: [] };
    }

    const { totalPages, page: currentPage, result } = aggregationResult[0];

    return { totalPages, page: currentPage, result };
  }

  async getAttendeesCount(webinarId: string, AdminId: string): Promise<any> {
    const webinarPipeline = {
      adminId: new Types.ObjectId(`${AdminId}`),
    };

    if (webinarId) {
      webinarPipeline['webinar'] = new Types.ObjectId(`${webinarId}`);
    }

    const totalContacts =
      (await this.attendeeModel.countDocuments(webinarPipeline)) || 0;

    return totalContacts;
  }

  async getPostWebinarAttendee(webinarId: string, adminId: string) {
    const result = await this.attendeeModel.findOne({
      webinar: new Types.ObjectId(`${webinarId}`),
      adminId: new Types.ObjectId(`${adminId}`),
      isAttended: true,
    });

    return result;
  }

  async updateAttendee(
    id: string,
    adminId: string,
    updateAttendeeDto: UpdateAttendeeDto,
  ) {
    const result = await this.attendeeModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      },
      updateAttendeeDto,
      { new: true },
    );
    if (!result) throw new NotFoundException('No record found to be updated.');
    return result;
  }

  async updateAttendeeAssign(id: string, assignedTo: string): Promise<Attendee | null> {
    return await this.attendeeModel.findByIdAndUpdate(id, {
      $set: {
        assignedTo: new Types.ObjectId(assignedTo),
      },
    }, { new: true });
  }

  async deleteAttendees(webinarId: string, AdminId: string): Promise<any> {
    const pipeline = {
      adminId: new Types.ObjectId(`${AdminId}`),
      webinar: new Types.ObjectId(`${webinarId}`),
    };
    const result = await this.attendeeModel.deleteMany(pipeline);

    return { message: 'Deleted data successfully!', result: result };
  }

  async checkPreviousAssignment(email: string): Promise<Attendee | null> {
    const lastAssigned = await this.attendeeModel
      .findOne({ email })
      .sort({ createdAt: -1 })
      .exec();

    return lastAssigned;
  }
}
