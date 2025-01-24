import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Attendee } from 'src/schemas/Attendee.schema';
import {
  AttendeesFilterDto,
  CreateAttendeeDto,
  UpdateAttendeeDto,
} from './dto/attendees.dto';
import { Assignments } from 'src/schemas/Assignments.schema';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import {
  notificationActionType,
  notificationType,
} from 'src/schemas/notification.schema';
import { NotificationService } from 'src/notification/notification.service';
import { WebinarService } from 'src/webinar/webinar.service';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Assignments.name)
    private readonly assignmentsModel: Model<Assignments>,
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => WebinarService))
    private readonly webinarService: WebinarService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async addAttendees(attendees: [CreateAttendeeDto]): Promise<any> {
    const result = await this.attendeeModel.create(attendees);
    return result;
  }

  async addPostAttendees(
    attendees: [CreateAttendeeDto],
    webinar: string,
    isAttended: boolean,
    adminId: string,
  ): Promise<any> {
    const subscription =
      await this.subscriptionService.getSubscription(adminId);

    const contactCountDiff =
      subscription.contactLimit - subscription.contactCount;

    if (contactCountDiff <= 0) {
      throw new BadRequestException('Contact Limit Exceeded');
    }
    let tempAttendees = attendees;

    const nonUniqueEmailCount = await this.getNonUniqueAttendeesCount(
      tempAttendees.map((a) => a.email),
      new Types.ObjectId(`${adminId}`),
    );
    const uniqueEmailsCount = tempAttendees.length - nonUniqueEmailCount;

    if (uniqueEmailsCount > contactCountDiff) {
      throw new BadRequestException('Contact Limit Exceeded');
    }
    console.log(
      ' --------------- > ',
      uniqueEmailsCount,
      contactCountDiff,
      nonUniqueEmailCount,
      tempAttendees.length,
    );




    const session = await this.attendeeModel.startSession();

    try {
      await session.withTransaction(async () => {
        const newAttendees = await this.attendeeModel.insertMany(tempAttendees, {
          session,
        });
        const assignedEmployees =
          await this.webinarService.getAssignedEmployees(webinar);

        const role = isAttended
          ? this.configService.get('appRoles')['EMPLOYEE_SALES']
          : this.configService.get('appRoles')['EMPLOYEE_REMINDER'];

        const empData: {
          id: Types.ObjectId;
          contactLimit: number;
          attendees: any[];
          assignMents: any[];
          contactCount: number;
        }[] = assignedEmployees
          .filter((emp) => emp.role.toString() === role)
          .map((emp) => ({
            id: emp._id,
            contactLimit: emp.dailyContactLimit - emp.dailyContactCount || 0,
            attendees: [],
            assignMents: [],
            contactCount: 0,
          }));

        const previousAssignments = await this.checkPreviousAssignmentInBulk(
          newAttendees.map((a) => a.email),
          adminId,
          isAttended,
          empData.map((a) => a.id),
        );

        const empDataMap = new Map(empData.map((a) => [a.id.toString(), a]));

        newAttendees.forEach((attendee, index) => {
          if (previousAssignments.has(attendee.email)) {
            const prevAssign = previousAssignments.get(attendee.email);

            if (empDataMap.has(prevAssign.assignedTo.toString())) {
              const emp = empDataMap.get(prevAssign.assignedTo.toString());
              if (emp.contactCount < emp.contactLimit) {
                emp.attendees.push(attendee);
                emp.contactCount += 1;
                const newAssignment = {
                  adminId: new Types.ObjectId(`${adminId}`),
                  webinar: new Types.ObjectId(`${webinar}`),
                  attendee: attendee._id,
                  user: emp.id,
                  recordType: isAttended ? 'postWebinar' : 'preWebinar',
                };
                emp.assignMents.push(newAssignment);
                empDataMap.set(prevAssign.assignedTo.toString(), emp);
              }
            }
          }
        });

        for (const [empId, empData] of empDataMap) {
          const newAssignments = await this.assignmentsModel.insertMany(
            empData.assignMents,
            { session },
          );
          const updatedAttendees = await this.attendeeModel.updateMany(
            { _id: { $in: empData.attendees.map((a) => a._id) } },
            { $set: { assignedTo: new Types.ObjectId(`${empId}`) } },
            { session },
          );

          await this.userService.incrementCount(
            empId,
            empData.contactCount,
            session,
          );
          if (
            newAssignments.length !== updatedAttendees.modifiedCount ||
            newAssignments.length !== empData.contactCount
          ) {
            throw new Error('Consistency check failed: mismatch in counts.');
          }

          const notification = {
            recipient: empId,
            title: 'New Tasks Assigned',
            message: `You have been assigned ${empData.contactCount} new tasks. Please check your task list for details.`,
            type: notificationType.INFO,
            actionType: notificationActionType.ASSIGNMENT,
            metadata: {
              webinarId: webinar,
            },
          };

          this.notificationService.createNotification(notification);
        }

        await this.subscriptionService.incrementContactCount(
          subscription._id.toString(),
          uniqueEmailsCount,
        );
      });
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAttendee(adminId: string, email: string): Promise<any> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          email: email,
          adminId: new Types.ObjectId(adminId),
        },
      },
      {
        $lookup: {
          from: 'webinars', // The name of the collection to populate from
          localField: 'webinar', // The field from the Attendee model
          foreignField: '_id', // The field in the Webinar collection
          as: 'webinarDetails', // Alias to store populated webinar details
        },
      },
      {
        $lookup: {
          from: 'users', // The collection for admin and assignedTo (User model)
          localField: 'adminId', // The field from Attendee to match in User
          foreignField: '_id', // The field in the User collection
          as: 'adminDetails', // Alias to store populated admin details
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort by createdAt in descending order
        },
      },
      {
        $project: {
          email: 1,
          attendeeHistory: {
            _id: '$_id',
            webinar: '$webinarDetails', // Webinar details from lookup
            admin: '$adminDetails', // Admin details from lookup
            phone: '$phone',
            gender: '$gender',
            firstName: '$firstName',
            lastName: '$lastName',
            leadType: '$leadType',
            timeInSession: '$timeInSession',
            assignedTo: '$assignedTo',
            isAttended: '$isAttended',
            createdAt: '$createdAt', // Include createdAt for sorting
            updatedAt: '$updatedAt', // Include updatedAt for reference
          },
        },
      },
      {
        $group: {
          _id: '$email', // Group by email
          data: {
            $push: '$attendeeHistory', // Collect all the attendee history data
          },
        },
      },
    ];

    const aggregationResult = await this.attendeeModel
      .aggregate(pipeline)
      .exec();

    return aggregationResult;
  }

  async getAttendees(
    webinarId: string,
    AdminId: string,
    isAttended: boolean,
    page: number,
    limit: number,
    filters: AttendeesFilterDto,
    validCall?: string,
    assignmentType?: string,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const hasFilters = Object.keys(filters).some(
      (key) => filters[key] !== null && filters[key] !== undefined,
    );

    const pipeline: PipelineStage[] = [
      // Step 1: Match key fields to reduce dataset size
      {
        $match: {
          adminId: new Types.ObjectId(AdminId),
          isAttended: isAttended,
          ...(webinarId &&
            webinarId !== '' && { webinar: new Types.ObjectId(webinarId) }),
          ...(filters.isAssigned &&
            (filters.isAssigned === 'true'
              ? { assignedTo: { $ne: null } }
              : {
                  $or: [
                    { assignedTo: null },
                    { assignedTo: { $exists: false } },
                  ],
                })),
          ...(validCall && {
            ...(validCall === 'Worked'
              ? { status: { $ne: null } }
              : { status: null }),
          }),
          ...(assignmentType && {
            ...(assignmentType === 'Assigned'
              ? {
                  $and: [
                    { assignedTo: { $ne: null } },
                    { isPulledback: { $ne: true } },
                  ],
                }
              : { assignedTo: null }),
          }),
        },
      },
      // Step 3: Apply optional filters

      ...(hasFilters
        ? [
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
                ...(filters.status && {
                  status: filters.status,
                }),
              },
            },
          ]
        : []),
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { email: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $addFields: {
                lookupField: { $ifNull: ['$tempAssignedTo', '$assignedTo'] },
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'lookupField',
                foreignField: '_id',
                as: 'assignedToDetails',
              },
            },
            {
              $project: {
                lookupField: 0, // Remove temporary lookupField if not needed in the output
              },
            },
            {
              $lookup: {
                from: 'attendeeassociations',
                localField: 'email',
                foreignField: 'email',
                as: 'attendeeAssociations',
              },
            },
            {
              $addFields: {
                isAssigned: {
                  $arrayElemAt: ['$assignedToDetails.userName', 0],
                },
                leadType: {
                  $arrayElemAt: ['$attendeeAssociations.leadType', 0],
                },
              },
            },
            {
              $project: { assignedToDetails: 0, attendeeAssociations: 0 },
            },
          ],
        },
      },
      // Step 7: Unwind metadata to extract total count and calculate total pages
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
    userId: string,
    updateAttendeeDto: UpdateAttendeeDto,
  ) {
    const attendee = await this.attendeeModel.findOne({
      _id: new Types.ObjectId(`${id}`),
    });

    if (
      String(userId) === String(attendee.assignedTo) ||
      String(userId) === String(attendee.adminId)
    ) {
      const result = await this.attendeeModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(`${id}`),
          adminId: new Types.ObjectId(`${adminId}`),
        },
        updateAttendeeDto,
        { new: true },
      );
      if (!result)
        throw new NotFoundException('No record found to be updated.');
      return result;
    } else
      throw new UnauthorizedException(
        'Only Admin or assigned attendee is allowed to update attendee data.',
      );
  }

  async updateAttendeeAssign(
    id: string,
    assignedTo: string,
  ): Promise<Attendee | null> {
    return await this.attendeeModel.findByIdAndUpdate(
      id,
      {
        $set: {
          assignedTo: Types.ObjectId.isValid(assignedTo)
            ? new Types.ObjectId(assignedTo)
            : null,
        },
      },
      { new: true },
    );
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
      .findOne({ email, isAttended: false })
      .sort({ createdAt: -1 })
      .exec();

    return lastAssigned;
  }

  async checkPreviousAssignmentInBulk(
    emails: string[],
    adminId: string,
    isAttended: boolean,
    empIds: Types.ObjectId[],
  ): Promise<
    Map<
      string,
      {
        _id: string;
        assignedTo: Types.ObjectId;
      }
    >
  > {
    if (emails.length === 0 || empIds.length === 0) return new Map();

    const pipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new Types.ObjectId(`${adminId}`),
          assignedTo: { $ne: null },
          isAttended: isAttended,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$email',
          firstDetail: { $first: '$$ROOT' },
        },
      },
      {
        $addFields: {
          assignedTo: '$firstDetail.assignedTo',
        },
      },
      {
        $project: {
          firstDetail: 0,
        },
      },
      {
        $match: {
          assignedTo: { $in: empIds },
        },
      },
    ];

    const lastAssigned: {
      _id: string;
      assignedTo: Types.ObjectId;
    }[] = await this.attendeeModel.aggregate(pipeline).exec();

    const lastAssignMap = new Map();
    lastAssigned.forEach((attendee) => {
      lastAssignMap.set(attendee._id, attendee);
    });

    // const result = {
    //   assignData: [],
    // };
    // emails.forEach((email) => {
    //   if (lastAssignMap.has(email)) {
    //     const attendee = lastAssignMap.get(email);
    //     result.assignData.push(attendee);
    //     if (attendee.assignedTo in result) {
    //       result[attendee.assignedTo] = result[attendee.assignedTo] + 1;
    //     } else {
    //       result[attendee.assignedTo] = 1;
    //     }
    //   }
    // });

    const result = new Map();
    emails.forEach((email) => {
      if (lastAssignMap.has(email)) {
        const attendee = lastAssignMap.get(email);
        result.set(email, attendee);
      }
    });

    return result;
  }

  async swapFields(
    attendeesIds: string[],
    field1: string,
    field2: string,
    adminId: string,
  ): Promise<Attendee[]> {
    if (!field1 || !field2) {
      throw new BadRequestException('Both field1 and field2 must be provided.');
    }

    const attendees = await this.attendeeModel
      .find({
        _id: { $in: attendeesIds },
        adminId: new Types.ObjectId(`${adminId}`),
      })
      .exec();

    if (attendees.length !== attendeesIds.length) {
      throw new BadRequestException('Some attendees were not found.');
    }

    const updatedAttendees = await Promise.all(
      attendees.map(async (attendee) => {
        if (!(field1 in attendee) || !(field2 in attendee)) {
          throw new BadRequestException(
            `Fields ${field1} or ${field2} do not exist in attendee.`,
          );
        }

        const temp = attendee[field1];
        attendee[field1] = attendee[field2];
        attendee[field2] = temp;

        await attendee.save();

        return attendee;
      }),
    );

    return updatedAttendees;
  }

  async getNonUniqueAttendeesCount(
    emails: string[],
    adminId: Types.ObjectId,
  ): Promise<number> {
    const pipiline: PipelineStage[] = [
      {
        $match: {
          adminId: adminId,
        },
      },
      {
        $match: {
          email: { $in: emails },
        },
      },
      {
        $group: {
          _id: '$email',
        },
      },
      {
        $count: 'emailCount',
      },
    ];

    const result = await this.attendeeModel.aggregate(pipiline);

    if (Array.isArray(result) && result.length > 0) {
      return result[0]?.emailCount || 0;
    }
    return 0;
  }

  async getDynamicAttendeeCount(adminId: Types.ObjectId) {
    const pipiline: PipelineStage[] = [
      { $match: { adminId } },
      { $group: { _id: '$email' } },
      { $count: 'emailCount' },
    ];
    const result = await this.attendeeModel.aggregate(pipiline);
    if (Array.isArray(result) && result.length > 0) {
      return result[0]?.emailCount || 0;
    }
    return 0;
  }

  async fillPhoneNumbers(attendees: [CreateAttendeeDto], adminId: Types.ObjectId) {
    
    const filteredAttendees = attendees.filter((attendee) => !attendee.phone)

  }
}
