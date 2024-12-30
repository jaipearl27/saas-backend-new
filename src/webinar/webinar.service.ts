import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Webinar } from 'src/schemas/Webinar.schema';
import { CreateWebinarDto, UpdateWebinarDto } from './dto/createWebinar.dto';
import { ConfigService } from '@nestjs/config';
import { AttendeesService } from 'src/attendees/attendees.service';
import { WebinarFilterDTO } from './dto/webinar-filter.dto';

@Injectable()
export class WebinarService {
  constructor(
    @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
    private readonly configService: ConfigService,
    private readonly attendeesService: AttendeesService,
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
    filters: WebinarFilterDTO = {},
    usePagination: boolean = true, // Flag to enable/disable pagination
  ): Promise<any> {
    console.log(filters);
    const skip = (page - 1) * limit;

    const query = { adminId: new Types.ObjectId(`${adminId}`) };

    const dateFilter: any = {};
    if (filters.webinarDate) {
      dateFilter['webinarDate'] = {};
      if (filters.webinarDate.$gte) {
        dateFilter['webinarDate']['$gte'] = new Date(filters.webinarDate.$gte);
      }
      if (filters.webinarDate.$lte) {
        dateFilter['webinarDate']['$lte'] = new Date(filters.webinarDate.$lte);
      }
    }

    // Base pipeline used for both cases
    const basePipeline: PipelineStage[] = [
      {
        $match: query,
      },
      {
        $match: {
          ...(filters.webinarName && {
            webinarName: { $regex: filters.webinarName, $options: 'i' },
          }),
          ...dateFilter,
        },
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
          assignedEmployees: 1,
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
        // Avoid redundant calculation by reusing fields directly
        $addFields: {
          totalParticipants: {
            $add: ['$totalAttendees', '$totalRegistrations'],
          },
        },
      },
      {
        $match: {
          ...(filters.totalRegistrations && {
            totalRegistrations: filters.totalRegistrations,
          }),
          ...(filters.totalAttendees && {
            totalAttendees: filters.totalAttendees,
          }),
          ...(filters.totalParticipants && {
            totalParticipants: filters.totalParticipants,
          }),
        },
      },
    ];

    if (usePagination) {
      // Add $facet stage for pagination
      basePipeline.push(
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: skip }, { $limit: limit }],
          },
        },
        {
          $unwind: {
            path: '$metadata',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            totalPages: { $ceil: { $divide: ['$metadata.total', limit] } },
            page: { $literal: page },
            result: '$data',
          },
        },
      );

      const result = await this.webinarModel.aggregate(basePipeline);
      return result.length > 0
        ? result[0]
        : { result: [], page, totalPages: 0 };
    } else {
      // Add skip and limit directly for consistent output without $facet
      basePipeline.push({ $skip: skip }, { $limit: limit });

      const result = await this.webinarModel.aggregate(basePipeline);
      return {
        result, // Return all data
        page: 1, // Fixed page
        totalPages: 1, // No pagination
      };
    }
  }

  async getWebinar(id: string, adminId: string): Promise<any> {
    const result = await this.webinarModel
      .findById(id)
      .populate('assignedEmployees')
      .lean();
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
    return {
      message: 'Webinar Deleted successfully',
      deletedWebinar,
      deletedAttendees,
    };
  }

  async getEmployeeWebinars(
    employeeId: string,
    adminId: string,
  ): Promise<Webinar[]> {
    const result = await this.webinarModel.find({
      assignedEmployees: { $in: [new Types.ObjectId(`${employeeId}`)] },
      adminId: new Types.ObjectId(`${adminId}`),
    });
    return result;
  }

  async getAssignedEmployees(webinarId: string): Promise<any> {
    const result = await this.webinarModel
      .findById(webinarId)
      .populate('assignedEmployees')
      .lean();

    if (!result) return [];

    return result.assignedEmployees || [];
  }
}