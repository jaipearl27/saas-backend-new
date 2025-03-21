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
  GroupedAttendeesFilterDto,
  GroupedAttendeesSortBy,
  GroupedAttendeesSortObject,
  SortOrder,
  SwapAttendeeFieldsDTO,
  UpdateAttendeeDto,
  WebinarAttendeesSortBy,
  WebinarAttendeesSortObject,
} from './dto/attendees.dto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import {
  notificationActionType,
  notificationType,
} from 'src/schemas/notification.schema';
import { NotificationService } from 'src/notification/notification.service';
import { WebinarService } from 'src/webinar/webinar.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { ClientSession } from 'mongoose';
import { DeleteResult } from 'mongodb';
import { AssignmentService } from 'src/assignment/assignment.service';
import async from 'async';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => WebinarService))
    private readonly webinarService: WebinarService,
    @Inject(forwardRef(() => AssignmentService))
    private readonly assignService: AssignmentService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async addAttendees(attendees: [CreateAttendeeDto]): Promise<any> {
    const result = await this.attendeeModel.create(attendees);
    return result;
  }

  emitProgress(socketId: null | string, value: number) {
    if (socketId) {
      this.websocketGateway.server.to(socketId).emit('import-export', {
        actionType: 'import',
        value: value,
      });
    }
  }

  emitNoteCreation(adminId: string) {
    const socketId = this.websocketGateway.activeUsers.get(String(adminId));
    if (socketId) {
      this.websocketGateway.server.to(socketId).emit('note-creation', {});
    }
  }

  async addPostAttendees(
    attendees: CreateAttendeeDto[],
    webinar: string,
    isAttended: boolean,
    adminId: string,
    postWebinarExists: boolean,
  ): Promise<any> {
    const subscription =
      await this.subscriptionService.getSubscription(adminId);

    const contactCountDiff =
      subscription.contactLimit - subscription.contactCount;

    if (contactCountDiff <= 0) {
      throw new BadRequestException('Contact Limit Exceeded');
    }
    let tempAttendees = attendees;

    console.log(this.websocketGateway.activeUsers);
    const socketId = this.websocketGateway.activeUsers.get(String(adminId));
    let lastProgress = 0;
    const updateProgress = (current) => {
      if (current - lastProgress >= 5) {
        // 5% increments
        this.emitProgress(socketId, current);
        lastProgress = current;
      }
    };

    let attendeesForUpdate: CreateAttendeeDto[] = [];
    if (!isAttended || (postWebinarExists && isAttended)) {
      const prevAttendees = await this.attendeeModel.find({
        webinar: new Types.ObjectId(`${webinar}`),
        adminId: new Types.ObjectId(`${adminId}`),
        isAttended: isAttended,
      });
      updateProgress(15);
      if (prevAttendees.length > 0) {
        const prevAttendeesMap = new Map(
          prevAttendees.map((a) => [a.email, a]),
        );

        const newAttendees = attendees.filter(
          (a) => !prevAttendeesMap.has(a.email),
        );
        tempAttendees = newAttendees;

        const prevAttendeesToUpdate = attendees.filter((a) =>
          prevAttendeesMap.has(a.email),
        );

        // Deduplicate by email
        const uniqueEmails = new Set();
        const uniquePrevAttendeesToUpdate = prevAttendeesToUpdate.filter(
          (a) => {
            if (uniqueEmails.has(a.email)) {
              return false;
            }
            uniqueEmails.add(a.email);
            return true;
          },
        );

        attendeesForUpdate = uniquePrevAttendeesToUpdate.map((attendee) => ({
          ...attendee,
          phone: attendee.phone || prevAttendeesMap.get(attendee.email).phone,
          attendeeId: prevAttendeesMap.get(attendee.email)
            ._id as Types.ObjectId,
        }));
      }
    }

    if (isAttended && !postWebinarExists) {
      const unattendedAttendees: CreateAttendeeDto[] =
        await this.getPreWebinarUnattendedData(
          new Types.ObjectId(`${adminId}`),
          new Types.ObjectId(`${webinar}`),
          attendees.map((a) => a.email),
        );
      updateProgress(20);

      if (unattendedAttendees.length > 0) {
        tempAttendees = [...tempAttendees, ...unattendedAttendees];
      }
    }

    const nonUniqueEmailCount = await this.getNonUniqueAttendeesCount(
      tempAttendees.map((a) => a.email),
      new Types.ObjectId(`${adminId}`),
    );
    updateProgress(25);
    const uniqueEmailsCount = tempAttendees.length - nonUniqueEmailCount;

    if (uniqueEmailsCount > contactCountDiff) {
      throw new BadRequestException('Contact Limit Exceeded');
    }

    const attendeesWithoutPhone = tempAttendees.filter((a) => !a.phone);

    if (attendeesWithoutPhone.length > 0) {
      const phoneNumbers = await this.getAttendeePhoneNumbers(
        new Types.ObjectId(`${adminId}`),
        attendeesWithoutPhone.map((a) => a.email),
      );
      updateProgress(30);

      const phoneMap = new Map(phoneNumbers.map((a) => [a._id, a.phone]));

      tempAttendees = tempAttendees.map((a) => ({
        ...a,
        phone: a.phone || (phoneMap.has(a.email) ? phoneMap.get(a.email) : ''),
      }));
    }

    const session = await this.attendeeModel.startSession();

    try {
      await session.withTransaction(async () => {
        if (attendeesForUpdate.length > 0) {
          const bulkOps = attendeesForUpdate.map((attendee) => ({
            updateOne: {
              filter: { _id: attendee.attendeeId },
              update: {
                $set: {
                  firstName: attendee.firstName || null,
                  lastName: attendee.lastName || null,
                  phone: attendee.phone,
                  gender: attendee.gender || null,
                  timeInSession: attendee.timeInSession || 0,
                  location: attendee.location || null,
                },
              },
            },
          }));
          await this.attendeeModel.bulkWrite(bulkOps, { session });
        }
        updateProgress(70);

        const newAttendees = await this.attendeeModel.insertMany(
          tempAttendees,
          {
            session,
          },
        );
        updateProgress(75);
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
        updateProgress(80);

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

        // Use parallel processing
        await async.eachLimit(
          Array.from(empDataMap),
          5,
          async ([empId, empData]) => {
            const newAssignments =
              await this.assignService.createManyAssignments(
                empData.assignMents,
                session,
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

            await this.notificationService.createNotification(notification);
          },
        );
        updateProgress(90);

        await this.subscriptionService.incrementContactCount(
          subscription._id.toString(),
          uniqueEmailsCount,
        );
        updateProgress(100);
      });
    } catch (error) {
      return {
        success: false,
        message: 'Importing failed',
        error: error?.message || 'something went wrong, check logs',
      };
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
            tags: '$tags',
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
    sort: WebinarAttendeesSortObject = {
      sortBy: WebinarAttendeesSortBy.EMAIL,
      sortOrder: SortOrder.ASC,
    },
    usePagination: boolean = true,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const hasFilters = Object.keys(filters).some(
      (key) => filters[key] !== null && filters[key] !== undefined,
    );

    const basePipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new Types.ObjectId(AdminId),
          webinar: new Types.ObjectId(webinarId),
          isAttended: isAttended,
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
                ...(filters.tags && {
                  tags: { $in: filters.tags },
                }),
              },
            },
          ]
        : []),

      ...(filters.leadType
        ? [
            {
              $lookup: {
                from: 'attendeeassociations',
                let: { tempMail: '$email' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$adminId', new Types.ObjectId(`${AdminId}`)],
                          },
                          { $eq: ['$email', '$$tempMail'] },
                          {
                            $eq: [
                              '$leadType',
                              new Types.ObjectId(filters.leadType),
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],

                as: 'attendeeAssociations',
              },
            },
            {
              $unwind: {
                path: '$attendeeAssociations',
                preserveNullAndEmptyArrays: false,
              },
            },
          ]
        : []),

      ...(filters?.enrollments?.length
        ? [
            {
              $lookup: {
                from: 'enrollments',
                let: { tempMail: '$email' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$attendee', '$$tempMail'],
                          },
                          {
                            $eq: ['$adminId', new Types.ObjectId(`${AdminId}`)],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$product',
                      count: {
                        $sum: 1,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'products',
                      localField: '_id',
                      foreignField: '_id',
                      as: 'product',
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      count: 1,
                      productName: {
                        $arrayElemAt: ['$product.name', 0],
                      },
                    },
                  },
                ],
                as: 'enrollments',
              },
            },
            {
              $match: {
                'enrollments._id': {
                  $in: filters.enrollments.map((id) => new Types.ObjectId(id)),
                },
              },
            },
          ]
        : []),
    ];

    const pipeline: PipelineStage[] = [
      ...basePipeline,
      { $sort: { [sort.sortBy]: sort.sortOrder === SortOrder.ASC ? 1 : -1 } },
      { $skip: skip },
      ...(limit > 0 ? [{ $limit: limit }] : []),
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
          lookupField: 0,
        },
      },
      ...(filters.leadType
        ? []
        : [
            {
              $lookup: {
                from: 'attendeeassociations',
                let: { tempMail: '$email' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$adminId', new Types.ObjectId(`${AdminId}`)],
                          },
                          { $eq: ['$email', '$$tempMail'] },
                        ],
                      },
                    },
                  },
                ],

                as: 'attendeeAssociations',
              },
            },
            {
              $unwind: {
                path: '$attendeeAssociations',
                preserveNullAndEmptyArrays: true,
              },
            },
          ]),
      {
        $addFields: {
          isAssigned: {
            $arrayElemAt: ['$assignedToDetails.userName', 0],
          },
          leadType: '$attendeeAssociations.leadType',
        },
      },
      ...(filters?.enrollments?.length
        ? []
        : [
            {
              $lookup: {
                from: 'enrollments',
                let: { tempMail: '$email' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$adminId', new Types.ObjectId(`${AdminId}`)],
                          },
                          {
                            $eq: ['$attendee', '$$tempMail'],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$product',
                      count: {
                        $sum: 1,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'products',
                      localField: '_id',
                      foreignField: '_id',
                      as: 'product',
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      count: 1,
                      productName: {
                        $arrayElemAt: ['$product.name', 0],
                      },
                    },
                  },
                ],
                as: 'enrollments',
              },
            },
          ]),
      {
        $project: {
          email: 1,
          firstName: 1,
          gender: 1,
          isAssigned: 1,
          isAttended: 1,
          lastName: 1,
          leadType: 1,
          location: 1,
          phone: 1,
          status: 1,
          timeInSession: 1,
          source: 1,
          createdAt: 1,
          tags: 1,
          enrollments: 1,
        },
      },
    ];
    // const totalResult = await this.attendeeModel
    //   .aggregate([...basePipeline, { $count: 'total' }])
    //   .exec();

    // const result = await this.attendeeModel.aggregate(pipeline).exec();

    if (usePagination) {
      const [result, totalResult] = await Promise.all([
        this.attendeeModel.aggregate(pipeline).exec(),
        this.attendeeModel
          .aggregate([...basePipeline, { $count: 'total' }])
          .exec(),
      ]);
      const total = totalResult[0]?.total || 0;

      const pagination = {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };

      return { pagination, result };
    } else {
      return this.attendeeModel
        .aggregate([
          ...pipeline,
          {
            $lookup: {
              from: 'attendees',
              let: { tempMail: '$email' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$adminId', new Types.ObjectId(`${AdminId}`)],
                        },
                        { $eq: ['$email', '$$tempMail'] },
                        { $ne: ['$phone', null] },
                        { $ne: ['$phone', ''] },
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: '$phone',
                  },
                },
              ],
              as: 'phoneDetails',
            },
          },
        ])
        .exec();
    }
  }

  async swapFields(payload: SwapAttendeeFieldsDTO, adminId: string) {
    const {
      attendees: attendeesIds,
      field1,
      field2,
      filters,
      webinarId,
      isAttended,
      validCall,
      assignmentType,
    } = payload;

    if (!field1 || !field2) {
      throw new BadRequestException('Both field1 and field2 must be provided.');
    }

    let attendees = [];

    if (attendeesIds.length > 0) {
      attendees = await this.attendeeModel
        .find({
          _id: { $in: attendeesIds },
          adminId: new Types.ObjectId(`${adminId}`),
        })
        .exec();
    } else {
      const result = await this.getAttendees(
        webinarId,
        adminId,
        isAttended,
        1,
        0,
        filters,
        validCall,
        assignmentType,
      );
      attendees = result.result;
    }

    if (attendeesIds.length > 0 && attendees.length !== attendeesIds.length) {
      throw new BadRequestException('Some attendees were not found.');
    }

    if (attendees.length === 0) {
      throw new BadRequestException('No attendees found to update');
    }

    const bulkOps = attendees.map((attendee) => ({
      updateOne: {
        filter: { _id: attendee._id },
        update: {
          $set: {
            [field1]: attendee[field2],
            [field2]: attendee[field1],
          },
        },
      },
    }));

    const result = await this.attendeeModel.bulkWrite(bulkOps);

    if (result.modifiedCount !== attendees.length) {
      throw new InternalServerErrorException(
        `Only ${result.modifiedCount} out of ${attendees.length} attendees were updated`,
      );
    }

    return { message: 'Attendees updated successfully', success: true };
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
      String(userId) === String(attendee.tempAssignedTo) ||
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
    isTemporary: boolean = false,
  ): Promise<Attendee | null> {
    return await this.attendeeModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(isTemporary
            ? {
                tempAssignedTo: Types.ObjectId.isValid(assignedTo)
                  ? new Types.ObjectId(assignedTo)
                  : null,
              }
            : {
                assignedTo: Types.ObjectId.isValid(assignedTo)
                  ? new Types.ObjectId(assignedTo)
                  : null,
              }),
        },
      },
      { new: true },
    );
  }

  async deleteAttendeesByWebinar(
    webinarId: Types.ObjectId,
    adminId: Types.ObjectId,
    session: ClientSession,
  ): Promise<DeleteResult> {
    const filter = {
      adminId: adminId,
      webinar: webinarId,
    };

    return this.attendeeModel.deleteMany(filter).session(session).exec();
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

    const result = new Map();
    emails.forEach((email) => {
      if (lastAssignMap.has(email)) {
        const attendee = lastAssignMap.get(email);
        result.set(email, attendee);
      }
    });

    return result;
  }

  async getNonUniqueAttendeesCount(
    emails: string[],
    adminId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<number> {
    const pipiline: PipelineStage[] = [
      {
        $match: {
          adminId: adminId,
        },
      },
      ...(emails.length > 0
        ? [
            {
              $match: {
                email: { $in: emails },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: '$email',
        },
      },
      {
        $count: 'emailCount',
      },
    ];

    const aggregation = this.attendeeModel.aggregate(pipiline);

    if (session) {
      aggregation.session(session);
    }

    const result = await aggregation.exec();

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

  async getPreWebinarUnattendedData(
    adminId: Types.ObjectId,
    webinarId: Types.ObjectId,
    emails: string[],
  ) {
    const result = await this.attendeeModel.find({
      adminId,
      webinar: webinarId,
      email: { $nin: emails },
      isAttended: false,
    });
    return result.map((attendee) => ({
      email: attendee.email,
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      phone: attendee.phone,
      timeInSession: 0,
      gender: attendee.gender,
      location: attendee.location,
      webinar: attendee.webinar,
      isAttended: true,
      adminId: attendee.adminId,
      tags: Array.isArray(attendee.tags) ? attendee.tags : [],
    }));
  }

  async getAttendeePhoneNumbers(
    adminId: Types.ObjectId,
    emails: string[] | string,
  ): Promise<{ _id: string; phone: string }[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          adminId,
          email: typeof emails === 'string' ? emails : { $in: emails },
          $and: [{ phone: { $exists: true } }, { phone: { $ne: '' } }],
        },
      },
      {
        $group: {
          _id: '$email',
          phone: {
            $first: '$phone',
          },
        },
      },
    ];
    return await this.attendeeModel.aggregate(pipeline).exec();
  }

  async fetchGroupedAttendees(
    adminId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    filters: GroupedAttendeesFilterDto = {},
    sort: GroupedAttendeesSortObject = {
      sortBy: GroupedAttendeesSortBy.EMAIL,
      sortOrder: SortOrder.ASC,
    },
  ) {
    const skip = (page - 1) * limit;
    const basePipeline: PipelineStage[] = [
      {
        $match: {
          adminId,
          ...(filters.email && {
            email: { $regex: filters.email },
          }),
        },
      },
      {
        $group: {
          _id: '$email',
          adminId: {
            $first: '$adminId',
          },
          timeInSession: {
            $sum: '$timeInSession',
          },
          attendeeId: {
            $first: '$_id',
          },
          records: {
            $push: '$$ROOT',
          },
          attendedWebinarCount: {
            $sum: {
              $cond: [{ $gt: ['$timeInSession', 0] }, 1, 0],
            },
          },
          registeredWebinarCount: {
            $sum: {
              $cond: [{ $eq: ['$isAttended', false] }, 1, 0],
            },
          },
        },
      },

      {
        $match: {
          ...(filters.timeInSession && {
            timeInSession: filters.timeInSession,
          }),
          ...(filters.attendedWebinarCount && {
            attendedWebinarCount: filters.attendedWebinarCount,
          }),
          ...(filters.registeredWebinarCount && {
            registeredWebinarCount: filters.registeredWebinarCount,
          }),
        },
      },

      ...(filters.leadType
        ? [
            {
              $lookup: {
                from: 'attendeeassociations',
                let: { tempMail: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$adminId', adminId] },
                          { $eq: ['$email', '$$tempMail'] },
                          {
                            $eq: [
                              '$leadType',
                              new Types.ObjectId(filters.leadType),
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],

                as: 'lead',
              },
            },
            {
              $unwind: {
                path: '$lead',
                preserveNullAndEmptyArrays: false,
              },
            },
          ]
        : []),

      ...(filters.lastAssignedTo || filters.lastStatus
        ? [
            {
              $addFields: {
                lastAssignedTo: {
                  $getField: {
                    field: 'assignedTo',
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$records',
                            as: 'rec',
                            cond: {
                              $and: [
                                { $eq: ['$$rec.isAttended', true] },
                                { $ne: ['$$rec.assignedTo', null] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                lastStatus: {
                  $getField: {
                    field: 'status',
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$records',
                            as: 'rec',
                            cond: {
                              $and: [
                                { $eq: ['$$rec.isAttended', true] },
                                { $ne: ['$$rec.status', null] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            {
              $match: {
                ...(filters.lastAssignedTo && {
                  lastAssignedTo: new Types.ObjectId(filters.lastAssignedTo),
                }),
                ...(filters.lastStatus && {
                  lastStatus: filters.lastStatus,
                }),
              },
            },
          ]
        : []),

      ...(filters?.enrollments?.length
        ? [
            {
              $lookup: {
                from: 'enrollments',
                let: { tempMail: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$attendee', '$$tempMail'],
                          },
                          {
                            $eq: ['$adminId', new Types.ObjectId(`${adminId}`)],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$product',
                      count: {
                        $sum: 1,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'products',
                      localField: '_id',
                      foreignField: '_id',
                      as: 'product',
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      count: 1,
                      productName: {
                        $arrayElemAt: ['$product.name', 0],
                      },
                    },
                  },
                ],
                as: 'enrollments',
              },
            },
            {
              $match: {
                'enrollments._id': {
                  $in: filters.enrollments.map((id) => new Types.ObjectId(id)),
                },
              },
            },
          ]
        : []),
    ];

    const countPipeline: PipelineStage[] = [
      ...basePipeline,
      { $count: 'total' },
    ];

    const mainPipeline: PipelineStage[] = [
      ...basePipeline,
      {
        $sort: {
          [sort.sortBy]: sort.sortOrder === SortOrder.ASC ? 1 : -1,
        },
      },
      { $skip: skip },
      ...(limit ? [{ $limit: limit }] : []),
      ...(filters.leadType
        ? []
        : [
            {
              $lookup: {
                from: 'attendeeassociations',
                let: { tempMail: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$adminId', adminId] },
                          { $eq: ['$email', '$$tempMail'] }, // Match email with attendee email
                        ],
                      },
                    },
                  },
                ],

                as: 'lead',
              },
            },
            {
              $unwind: {
                path: '$lead',
                preserveNullAndEmptyArrays: true,
              },
            },
          ]),
      ...(!(filters.lastAssignedTo || filters.lastStatus)
        ? [
            {
              $addFields: {
                lastAssignedTo: {
                  $getField: {
                    field: 'assignedTo',
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$records',
                            as: 'rec',
                            cond: {
                              $and: [
                                { $eq: ['$$rec.isAttended', true] },
                                { $ne: ['$$rec.assignedTo', null] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                lastStatus: {
                  $getField: {
                    field: 'status',
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$records',
                            as: 'rec',
                            cond: {
                              $and: [
                                { $eq: ['$$rec.isAttended', true] },
                                { $ne: ['$$rec.status', null] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
          ]
        : []),

      {
        $lookup: {
          from: 'users',
          localField: 'lastAssignedTo',
          foreignField: '_id',
          as: 'lastAssignedToDetails',
        },
      },
      ...(filters?.enrollments?.length
        ? []
        : [
            {
              $lookup: {
                from: 'enrollments',
                let: { tempMail: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$attendee', '$$tempMail'],
                          },
                          {
                            $eq: ['$adminId', new Types.ObjectId(`${adminId}`)],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$product',
                      count: {
                        $sum: 1,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'products',
                      localField: '_id',
                      foreignField: '_id',
                      as: 'product',
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      count: 1,
                      productName: {
                        $arrayElemAt: ['$product.name', 0],
                      },
                    },
                  },
                ],
                as: 'enrollments',
              },
            },
          ]),
      {
        $project: {
          lastAssignedTo: {
            $arrayElemAt: ['$lastAssignedToDetails.userName', 0],
          },
          enrollments: 1,
          lastStatus: 1,
          leadType: '$lead.leadType',
          adminId: 1,
          timeInSession: 1,
          attendeeId: 1,
          attendedWebinarCount: 1,
          registeredWebinarCount: 1,
        },
      },
    ];

    const [countResult, mainResult] = await Promise.all([
      this.attendeeModel.aggregate(countPipeline).exec(),
      this.attendeeModel.aggregate(mainPipeline).exec(),
    ]);
    const total = countResult[0]?.total || 0;
    const totalPages = limit ? Math.ceil(total / limit) || 1 : 1;
    const pagination = { page, totalPages, total };
    return { data: mainResult || [], pagination };
  }

  async fetchGroupedAttendeesForExport(
    adminId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    filters: GroupedAttendeesFilterDto = {},
    sort: GroupedAttendeesSortObject = {
      sortBy: GroupedAttendeesSortBy.EMAIL,
      sortOrder: SortOrder.ASC,
    },
  ) {
    const skip = (page - 1) * limit;
    const basePipeline: PipelineStage[] = [
      {
        $match: {
          adminId,
          ...(filters.email && {
            email: { $regex: filters.email },
          }),
        },
      },
      {
        $group: {
          _id: '$email',
          adminId: {
            $first: '$adminId',
          },
          timeInSession: {
            $sum: '$timeInSession',
          },
          attendeeId: {
            $first: '$_id',
          },
          records: {
            $push: '$$ROOT',
          },
          attendedWebinarCount: {
            $sum: {
              $cond: [{ $gt: ['$timeInSession', 0] }, 1, 0],
            },
          },
          registeredWebinarCount: {
            $sum: {
              $cond: [{ $eq: ['$isAttended', false] }, 1, 0],
            },
          },
        },
      },

      {
        $match: {
          ...(filters.timeInSession && {
            timeInSession: filters.timeInSession,
          }),
          ...(filters.attendedWebinarCount && {
            attendedWebinarCount: filters.attendedWebinarCount,
          }),
          ...(filters.registeredWebinarCount && {
            registeredWebinarCount: filters.registeredWebinarCount,
          }),
        },
      },

      ...(filters.leadType
        ? [
            {
              $lookup: {
                from: 'attendeeassociations',
                let: { tempMail: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$adminId', adminId] },
                          { $eq: ['$email', '$$tempMail'] },
                          {
                            $eq: [
                              '$leadType',
                              new Types.ObjectId(filters.leadType),
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],

                as: 'lead',
              },
            },
            {
              $unwind: {
                path: '$lead',
                preserveNullAndEmptyArrays: false,
              },
            },
          ]
        : []),

      ...(filters.lastAssignedTo || filters.lastStatus
        ? [
            {
              $addFields: {
                lastAssignedTo: {
                  $getField: {
                    field: 'assignedTo',
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$records',
                            as: 'rec',
                            cond: {
                              $and: [
                                { $eq: ['$$rec.isAttended', true] },
                                { $ne: ['$$rec.assignedTo', null] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                lastStatus: {
                  $getField: {
                    field: 'status',
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$records',
                            as: 'rec',
                            cond: {
                              $and: [
                                { $eq: ['$$rec.isAttended', true] },
                                { $ne: ['$$rec.status', null] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            {
              $match: {
                ...(filters.lastAssignedTo && {
                  lastAssignedTo: new Types.ObjectId(filters.lastAssignedTo),
                }),
                ...(filters.lastStatus && {
                  lastStatus: filters.lastStatus,
                }),
              },
            },
          ]
        : []),

      ...(filters?.enrollments?.length
        ? [
            {
              $lookup: {
                from: 'enrollments',
                let: { tempMail: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$attendee', '$$tempMail'],
                          },
                          {
                            $eq: ['$adminId', new Types.ObjectId(`${adminId}`)],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$product',
                      count: {
                        $sum: 1,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'products',
                      localField: '_id',
                      foreignField: '_id',
                      as: 'product',
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      count: 1,
                      productName: {
                        $arrayElemAt: ['$product.name', 0],
                      },
                    },
                  },
                ],
                as: 'enrollments',
              },
            },
            {
              $match: {
                'enrollments._id': {
                  $in: filters.enrollments.map((id) => new Types.ObjectId(id)),
                },
              },
            },
          ]
        : []),
    ];

    const countPipeline: PipelineStage[] = [
      ...basePipeline,
      { $count: 'total' },
    ];

    const mainPipeline: PipelineStage[] = [
      ...basePipeline,
      {
        $sort: {
          [sort.sortBy]: sort.sortOrder === SortOrder.ASC ? 1 : -1,
        },
      },
      { $skip: skip },
      ...(limit ? [{ $limit: limit }] : []),
      ...(filters.leadType
        ? []
        : [
            {
              $lookup: {
                from: 'attendeeassociations',
                let: { tempMail: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$adminId', adminId] },
                          { $eq: ['$email', '$$tempMail'] }, // Match email with attendee email
                        ],
                      },
                    },
                  },
                ],

                as: 'lead',
              },
            },
            {
              $unwind: {
                path: '$lead',
                preserveNullAndEmptyArrays: true,
              },
            },
          ]),
      ...(!(filters.lastAssignedTo || filters.lastStatus)
        ? [
            {
              $addFields: {
                lastAssignedTo: {
                  $getField: {
                    field: 'assignedTo',
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$records',
                            as: 'rec',
                            cond: {
                              $and: [
                                { $eq: ['$$rec.isAttended', true] },
                                { $ne: ['$$rec.assignedTo', null] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                lastStatus: {
                  $getField: {
                    field: 'status',
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$records',
                            as: 'rec',
                            cond: {
                              $and: [
                                { $eq: ['$$rec.isAttended', true] },
                                { $ne: ['$$rec.status', null] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
          ]
        : []),

      {
        $lookup: {
          from: 'users',
          localField: 'lastAssignedTo',
          foreignField: '_id',
          as: 'lastAssignedToDetails',
        },
      },
      ...(filters?.enrollments?.length
        ? []
        : [
            {
              $lookup: {
                from: 'enrollments',
                let: { tempMail: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$attendee', '$$tempMail'],
                          },
                          {
                            $eq: ['$adminId', new Types.ObjectId(`${adminId}`)],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$product',
                      count: {
                        $sum: 1,
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'products',
                      localField: '_id',
                      foreignField: '_id',
                      as: 'product',
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      count: 1,
                      productName: {
                        $arrayElemAt: ['$product.name', 0],
                      },
                    },
                  },
                ],
                as: 'enrollments',
              },
            },
          ]),
      {
        $project: {
          lastAssignedTo: {
            $arrayElemAt: ['$lastAssignedToDetails.userName', 0],
          },
          enrollments: 1,
          lastStatus: 1,
          leadType: '$lead.leadType',
          adminId: 1,
          timeInSession: 1,
          attendeeId: 1,
          attendedWebinarCount: 1,
          registeredWebinarCount: 1,
        },
      },
      {
        $lookup: {
          from: 'attendees',
          let: { tempMail: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$adminId', adminId],
                    },
                    { $eq: ['$email', '$$tempMail'] },
                    { $ne: ['$phone', null] },
                    { $ne: ['$phone', ''] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$phone',
              },
            },
          ],
          as: 'phoneDetails',
        },
      },
    ];

    const [countResult, mainResult] = await Promise.all([
      this.attendeeModel.aggregate(countPipeline).exec(),
      this.attendeeModel.aggregate(mainPipeline).exec(),
    ]);

    const parsedData = mainResult.map((item) => ({
      email: item._id,
      ...item,
      enrollments: Array.isArray(item.enrollments)
        ? item.enrollments
            .map((enrollment) =>
              enrollment?.productName
                ? `${enrollment.productName}-${enrollment.count}`
                : '-',
            )
            .join(',')
        : ' - ',
    }));

    const total = countResult[0]?.total || 0;
    const totalPages = limit ? Math.ceil(total / limit) || 1 : 1;
    const pagination = { page, totalPages, total };
    return { data: parsedData || [], pagination };
  }

  async getAttendeeForDeletion(
    webinarId: Types.ObjectId,
    session: ClientSession,
  ) {
    return await this.attendeeModel
      .find({ webinar: webinarId })
      .session(session);
  }

  async fetchAssigned(attendeeIds: Types.ObjectId[]) {
    return this.attendeeModel.find({
      _id: { $in: attendeeIds },
      assignedTo: { $ne: null },
    });
  }

  async updateAttendees(query: any, set: any, session?: ClientSession) {
    return this.attendeeModel.updateMany(
      query,
      { $set: set },
      { ...(session ? { session } : {}) },
    );
  }

  async fetchAttendeeByWebinar(email: string, webinarId: string) {
    return this.attendeeModel.findOne({
      email,
      webinar: new Types.ObjectId(webinarId),
    });
  }

  async fetchAttendeeById(id: Types.ObjectId) {
    return this.attendeeModel.findById(id);
  }
}
