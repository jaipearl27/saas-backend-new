import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Webinar } from 'src/schemas/Webinar.schema';
import { CreateWebinarDto, UpdateWebinarDto } from './dto/createWebinar.dto';
import { AttendeesService } from 'src/attendees/attendees.service';
import { WebinarFilterDTO } from './dto/webinar-filter.dto';
import { NotificationService } from 'src/notification/notification.service';
import {
  notificationActionType,
  notificationType,
} from 'src/schemas/notification.schema';
import { AssignmentService } from 'src/assignment/assignment.service';
import { NotesService } from 'src/notes/notes.service';
import { AlarmService } from 'src/alarm/alarm.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { Logger } from '@nestjs/common';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class WebinarService {
  private readonly logger = new Logger(WebinarService.name);

  constructor(
    @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
    @Inject(forwardRef(() => AttendeesService))
    private readonly attendeesService: AttendeesService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => NotesService))
    private readonly notesService: NotesService,
    @Inject(forwardRef(() => AlarmService))
    private readonly alarmService: AlarmService,
    @Inject(forwardRef(() => AssignmentService))
    private readonly assignmentService: AssignmentService,
    private readonly enrollmentService: EnrollmentsService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService

  ) {}

  async createWebiar(createWebinarDto: CreateWebinarDto): Promise<any> {
    // Create webinar
    console.log(createWebinarDto);

    const result = await this.webinarModel.create(createWebinarDto);

    if (result) {
      createWebinarDto.assignedEmployees.forEach(async (employeeId) => {
        // Create a notification for each assigned employee
        await this.notificationService.createNotification({
          recipient: `${employeeId}`,
          title: 'New Webinar Assigned',
          message: `You have been assigned to a new webinar: ${createWebinarDto.webinarName}`,
          type: notificationType.INFO,
          actionType: notificationActionType.WEBINAR_ASSIGNMENT,
          metadata: {
            webinarId: result._id,
            webinarTitle: createWebinarDto.webinarName,
          },
        });
      });
    }

    return result;
  }

  async getWebinars(
    adminId: string,
    page: number,
    limit: number,
    filters: WebinarFilterDTO = {},
    usePagination: boolean = true, // Flag to enable/disable pagination
  ): Promise<any> {
    console.log("limterr-r ===> ", limit)
    
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
                cond: {
                  $and: [
                    { $eq: ['$$attendee.isAttended', true] },
                    { $gt: ['$$attendee.timeInSession', 0] },
                  ],
                },
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

          totalParticipants: {
            $size: {
              $filter: {
                input: '$attendees',
                as: 'attendee',
                cond: { $eq: ['$$attendee.isAttended', true] },
              },
            },
          },
          productIds: 1,
        },
      },
      {
        $addFields: {
          totalUnAttended: {
            $subtract: ['$totalParticipants', '$totalAttendees'],
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
          ...(filters.totalUnAttended && {
            totalUnAttended: filters.totalUnAttended,
          }),
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort by createdAt in descending order
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
      basePipeline.push({ $skip: skip }, ...(limit ? [{ $limit: limit }]: []));

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
      .populate('productIds')
      .lean();
    return result;
  }

  async updateWebinar(
    id: string,
    adminId: string,
    updateWebinarDto: UpdateWebinarDto,
  ): Promise<any> {
    //update webinar
    console.log(updateWebinarDto);
    const result = await this.webinarModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      },
      {
        $set: {
          ...updateWebinarDto,
        },
      },
    );
    return result;
  }

  async deleteWebinar(id: string, admin: string): Promise<any> {
    const webinarId = new Types.ObjectId(`${id}`);
    const adminId = new Types.ObjectId(`${admin}`);
    const session = await this.webinarModel.db.startSession();
    
    try {
      session.startTransaction();
      
      // Delete webinar
      const deletedWebinar = await this.webinarModel.findOneAndDelete({
        _id: webinarId,
        adminId: new Types.ObjectId(adminId)
      }).session(session);

      if (!deletedWebinar) {
        throw new NotFoundException('Webinar not found');
      }

      const attendees: any = await this.attendeesService.getAttendeeForDeletion(webinarId,session);
      const attendeeIds = attendees.map(a => a._id);

      // Configure deletion workflow
      const DELETION_DEPENDENCIES = [
        {
          service: this.alarmService,
          method: 'deleteAlarmsByAttendeeIds',
          args: [attendeeIds]
        },
        {
          service: this.assignmentService,
          method: 'deleteAssignmentsByWebinar',
          args: [adminId, webinarId]
        },
        {
          service: this.attendeesService,
          method: 'deleteAttendeesByWebinar',
          args: [webinarId, adminId]
        },
        {
          service: this.enrollmentService,
          method: 'deleteAssignmentsByWebinar',
          args: [adminId, webinarId]
        },
        {
          service: this.notesService,
          method: 'deleteNotesByAttendees',
          args: [attendeeIds]
        },
        {
          service: this.notificationService,
          method: 'deleteNotificationsByWebinar',
          args: [webinarId]
        }
      ];

      // Execute deletions
      for (const dependency of DELETION_DEPENDENCIES) {
        await dependency.service[dependency.method](
          ...dependency.args,
          session
        );
      }
      const contactCount = await this.attendeesService.getNonUniqueAttendeesCount([], adminId, session);

      await this.subscriptionService.updateContactCount(adminId, contactCount, session)

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Partial deletion failure: ${error.message}`, error.stack);
      throw new Error('Partial deletion failure - check logs');
    } finally {
      await session.endSession();
    }

    return { message: 'Webinar deleted successfully' };
  }

  async getEmployeeWebinars(
    employeeId: string,
    adminId: string,
  ): Promise<Webinar[]> {
    const result = await this.webinarModel
      .find({
        assignedEmployees: { $in: [new Types.ObjectId(`${employeeId}`)] },
        adminId: new Types.ObjectId(`${adminId}`),
      })
      .sort({ createdAt: -1 });
    return result;
  }

  async getAssignedEmployees(webinarId: string): Promise<any> {
    const result: any = await this.webinarModel
      .findById(webinarId)
      .populate('assignedEmployees')
      .lean();

    if (!result || !Array.isArray(result.assignedEmployees)) return [];

    return (
      result.assignedEmployees.filter((employee) => employee?.isActive) || []
    );
  }

}
