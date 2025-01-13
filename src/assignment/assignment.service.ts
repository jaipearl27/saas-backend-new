import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, PipelineStage, Types } from 'mongoose';
import {
  Assignments,
  AssignmentStatus,
  RecordType,
} from 'src/schemas/Assignments.schema';
import { AssignmentDto, ReAssignmentDTO } from './dto/Assignment.dto';
import { ConfigService } from '@nestjs/config';
import {
  AttendeesFilterDto,
  CreateAttendeeDto,
} from 'src/attendees/dto/attendees.dto';
import { Attendee } from 'src/schemas/Attendee.schema';
import { WebinarService } from 'src/webinar/webinar.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { AttendeesService } from 'src/attendees/attendees.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/schemas/User.schema';
import { NotificationService } from 'src/notification/notification.service';
import { title } from 'process';
import {
  notificationActionType,
  notificationType,
} from 'src/schemas/notification.schema';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(Assignments.name) private assignmentsModel: Model<Assignments>,
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
    @InjectConnection() private readonly mongoConnection: Connection,

    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly webinarService: WebinarService,
    private readonly subscriptionService: SubscriptionService,
    private readonly attendeeService: AttendeesService,
    private readonly userService: UsersService,
  ) {}

  async getAssignments(
    adminId: string,
    id: string,
    page: number,
    limit: number,
    filters: AttendeesFilterDto = {},
    webinarId: string = '',
    validCall: string = '',
    assignmentStatus: AssignmentStatus,
    usePagination: boolean = true, // Flag to enable/disable pagination
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const basePipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
          ...(id && { user: new Types.ObjectId(id) }),
          ...(webinarId && { webinar: new Types.ObjectId(webinarId) }),
          status: assignmentStatus,
        },
      },
      {
        $lookup: {
          from: 'attendees',
          localField: 'attendee',
          foreignField: '_id',
          as: 'attendee',
        },
      },
      {
        $unwind: {
          path: '$attendee',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          attendeeId: '$attendee._id',
          email: '$attendee.email',
          firstName: '$attendee.firstName',
          lastName: '$attendee.lastName',
          isAttended: '$attendee.isAttended',
          validCall: '$attendee.validCall',
          gender: '$attendee.gender',
          leadType: '$attendee.leadType',
          location: '$attendee.location',
          phone: '$attendee.phone',
          status: '$attendee.status',
          timeInSession: '$attendee.timeInSession',
          webinar: '$attendee.webinar',
          createdAt: '$createdAt',
        },
      },
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
          ...(validCall && {
            ...(validCall === 'Worked'
              ? { status: { $ne: null } }
              : { status: null }),
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

      const result = await this.assignmentsModel.aggregate(basePipeline);
      return result.length > 0
        ? result[0]
        : { result: [], page, totalPages: 0 };
    } else {
      // Add skip and limit stages directly for non-paginated results
      basePipeline.push(
        { $skip: skip },
        { $limit: limit },
        { $sort: { createdAt: -1 } },
      );

      const result = await this.assignmentsModel.aggregate(basePipeline).exec();
      return {
        result,
        page: 1, // Fixed page for non-paginated
        totalPages: 1, // No pagination
      };
    }
  }

  async addAssignment(
    assignmentDto: [AssignmentDto],
    employee,
    webinar: string,
  ): Promise<any> {
    //check if assignment type and employee type match
    const assignments = [];
    const failedAssignments = [];
    const assignmentDtoLength = assignmentDto.length;

    const empContactLimit = employee?.dailyContactLimit ?? 0;
    const empContactCount = employee?.dailyContactCount ?? 0;

    if (empContactCount + assignmentDtoLength > empContactLimit) {
      throw new BadRequestException('Daily Contact Limit Exceeded');
    }

    for (let i = 0; i < assignmentDtoLength; i++) {
      assignmentDto[i]['adminId'] = employee.adminId;
      assignmentDto[i].user = employee._id;
      assignmentDto[i].webinar = webinar;

      //checking if attendee is currently assigned to someone---
      const attendeeData = await this.attendeeModel.findOne({
        _id: new Types.ObjectId(`${assignmentDto[i].attendee}`),
        webinar: new Types.ObjectId(`${webinar}`),
        isAttended: assignmentDto[i].recordType === 'preWebinar' ? false : true,
      });

      const assignedTo =
        attendeeData?.assignedTo !== null
          ? String(attendeeData.assignedTo)
          : null;

      if (![null, String(employee.adminId)].includes(assignedTo)) {
        failedAssignments.push({
          attendee: assignmentDto[i],
          message:
            'Attendee already assigned to an employee, Pullback to assign to a new employee.',
        });
        continue;
      }
      try {
        if (assignmentDto[i].recordType === 'preWebinar') {
          // assignment to reminder employees
          if (
            String(employee.role) ===
            this.configService.get('appRoles')['EMPLOYEE_REMINDER']
          ) {
            // reminder employee assignment logic
            const result = await this.assignmentsModel.create(assignmentDto[i]);
            assignments.push(result);

            const attendee = await this.attendeeModel.findByIdAndUpdate(
              assignmentDto[i].attendee,
              {
                assignedTo: employee._id,
              },
            );

            // Increment the employee's daily contact count
            const isIncremented = await this.userService.incrementCount(
              employee._id.toString(),
            );

            if (!isIncremented) {
              throw new InternalServerErrorException(
                'Failed to update employee contact count.',
              );
            }
          } else {
            failedAssignments.push({
              attendee: assignmentDto[i],
              message:
                'Pre-Webinar records can only be assigned to Reminder Employee',
            });
          }
        } else if (assignmentDto[i].recordType === 'postWebinar') {
          // assignment to reminder employees
          if (
            String(employee.role) ===
            this.configService.get('appRoles')['EMPLOYEE_SALES']
          ) {
            // sales employee assignment logic
            const result = await this.assignmentsModel.create(assignmentDto[i]);
            assignments.push(result);

            const attendee = await this.attendeeModel.findByIdAndUpdate(
              assignmentDto[i].attendee,
              {
                assignedTo: employee._id,
              },
            );

            // Increment the employee's daily contact count
            const isIncremented = await this.userService.incrementCount(
              employee._id.toString(),
            );

            if (!isIncremented) {
              throw new InternalServerErrorException(
                'Failed to update employee contact count.',
              );
            }
          } else {
            failedAssignments.push({
              attendee: assignmentDto[i],
              message:
                'Post-Webinar records can only be assigned to Sales Employee',
            });
          }
        } else {
          failedAssignments.push({
            attendee: assignmentDto[i],
            message: 'Record type must be Pre or Post Webinar.',
          });
        }
      } catch (error) {
        failedAssignments.push({
          attendee: assignmentDto[i],
          message: error,
        });
      }
    }

    if (assignments.length > 0) {
      const [assignment] = assignments;
      const notification = {
        recipient: assignment?.user,
        title: 'New Tasks Assigned',
        message: `You have been assigned ${assignments.length} new tasks. Please check your task list for details.`,
        type: notificationType.INFO,
        actionType: notificationActionType.ASSIGNMENT,
        metadata: {
          webinarId: assignment?.webinar,
        },
      };

      await this.notificationService.createNotification(notification);
    }

    return { assignments, failedAssignments };
  }

  async addPreWebinarAssignments(
    adminId: string,
    webinarId: string,
    attendee: CreateAttendeeDto,
  ) {
    const recordType = 'preWebinar';
    // Fetch the webinar details for the given webinar ID and admin ID
    const webinar = await this.webinarService.getWebinar(webinarId, adminId);

    if (!webinar) {
      throw new NotFoundException('Webinar not found.');
    }

    // Check if an attendee with the same email is already added to this webinar
    const existingAttendee = await this.attendeeModel.findOne({
      email: attendee.email,
      webinar: new Types.ObjectId(webinarId),
    });
    if (existingAttendee) {
      throw new BadRequestException(
        'Attendee already exists for this webinar.',
      );
    }

    // Get the current count of attendees added by the admin
    const attendeesCount = await this.attendeeService.getAttendeesCount(
      '',
      adminId,
    );

    // Fetch the subscription details for the admin
    const subscription =
      await this.subscriptionService.getSubscription(adminId);

    // Check subscription validity and attendee limits
    if (
      !subscription ||
      subscription.expiryDate < new Date() || // Subscription expired
      subscription.contactLimit <= attendeesCount // Contact limit reached
    ) {
      throw new ForbiddenException(
        'Contact limit reached or subscription expired.',
      );
    }

    // Add the attendee to the database
    const newAttendees: Attendee[] | null =
      await this.attendeeService.addAttendees([
        {
          ...attendee,
          isAttended: false,
          webinar: new Types.ObjectId(webinarId),
          adminId: new Types.ObjectId(adminId),
        },
      ]);

    if (
      !newAttendees ||
      !Array.isArray(newAttendees) ||
      newAttendees.length === 0
    ) {
      throw new InternalServerErrorException('Failed to add attendee.');
    }

    const newAttendee = newAttendees[0];

    // Validate webinar assigned employees
    if (!Array.isArray(webinar.assignedEmployees)) {
      throw new InternalServerErrorException(
        'Assigned employees for the webinar are missing or invalid.',
      );
    }

    // Check if the attendee was previously assigned to an employee
    const lastAssigned = await this.attendeeService.checkPreviousAssignment(
      newAttendee.email,
    );

    // If previously assigned, check if the same employee can be reassigned
    if (lastAssigned && lastAssigned.assignedTo) {
      const isEmployeeAssignedToWebinar = webinar.assignedEmployees.some(
        (employee) => {
          return (
            employee._id.toString() === lastAssigned.assignedTo.toString() &&
            employee.role.toString() ===
              this.configService.get('appRoles')['EMPLOYEE_REMINDER']
          );
        },
      );

      // If the same employee is assigned to this webinar
      if (isEmployeeAssignedToWebinar) {
        const employee = await this.userService.getEmployee(
          lastAssigned.assignedTo.toString(),
        );

        // Validate employee's daily contact limit
        if (
          employee &&
          employee.dailyContactLimit > employee.dailyContactCount
        ) {
          // Create a new assignment
          const newAssignment = await this.assignmentsModel.create({
            adminId: new Types.ObjectId(adminId),
            webinar: new Types.ObjectId(webinarId),
            attendee: newAttendee._id,
            user: employee._id,
            recordType: recordType,
          });
          if (!newAssignment) {
            throw new InternalServerErrorException(
              'Failed to create assignment.',
            );
          }

          // Increment the employee's daily contact count
          const isIncremented = await this.userService.incrementCount(
            employee._id.toString(),
          );

          if (!isIncremented) {
            throw new InternalServerErrorException(
              'Failed to update employee contact count.',
            );
          }

          const updatedAttendee =
            await this.attendeeService.updateAttendeeAssign(
              newAttendee._id.toString(),
              employee._id.toString(),
            );
          if (!updatedAttendee) {
            throw new InternalServerErrorException(
              'Failed to update employee contact count.',
            );
          }

          const notification = {
            recipient: employee._id.toString(),
            title: 'New Task Assigned',
            message: `You have been assigned a new task. Please check your task list for details.`,
            type: notificationType.INFO,
            actionType: notificationActionType.ASSIGNMENT,
            metadata: {
              webinarId,
              attendeeId: newAttendee._id.toString(),
              assignmentId: newAssignment._id.toString(),
            },
          };
    
          await this.notificationService.createNotification(notification);

          return { newAssignment, updatedAttendee };
        }
      }
    } else {
      // If no previous assignment, find the next available employee
      const empwithDiff = webinar.assignedEmployees.map((emp) => {
        return {
          ...emp,
          difference: emp.dailyContactLimit - (emp.dailyContactCount || 0), // Calculate remaining capacity
        };
      });
      const filteredEmployee = empwithDiff.filter(
        (emp) =>
          emp.difference > 0 &&
          emp.role.toString() ===
            this.configService.get('appRoles').EMPLOYEE_REMINDER, // Only employees with the correct role and capacity
      );

      const employees = filteredEmployee.sort(
        (a, b) => b.difference - a.difference,
      ); // Sort by the largest remaining capacity first

      if (employees.length > 0) {
        const employee = employees[0]; // Pick the employee with the smallest remaining capacity

        // Create a new assignment
        const newAssignment = await this.assignmentsModel.create({
          adminId: new Types.ObjectId(adminId),
          webinar: new Types.ObjectId(webinarId),
          attendee: new Types.ObjectId(`${newAttendee._id}`),
          user: new Types.ObjectId(`${employee._id}`),
          recordType: recordType,
        });

        if (!newAssignment) {
          throw new InternalServerErrorException(
            'Failed to create assignment.',
          );
        }

        // Increment the employee's daily contact count
        const isIncremented = await this.userService.incrementCount(
          employee._id.toString(),
        );

        if (!isIncremented) {
          throw new InternalServerErrorException(
            'Failed to update employee contact count.',
          );
        }

        const updatedAttendee = await this.attendeeService.updateAttendeeAssign(
          newAttendee._id.toString(),
          employee._id.toString(),
        );
        if (!updatedAttendee) {
          throw new InternalServerErrorException(
            'Failed to update employee contact count.',
          );
        }

        const notification = {
          recipient: employee._id.toString(),
          title: 'New Task Assigned',
          message: `You have been assigned a new task. Please check your task list for details.`,
          type: notificationType.INFO,
          actionType: notificationActionType.ASSIGNMENT,
          metadata: {
            webinarId,
            attendeeId: newAttendee._id.toString(),
            assignmentId: newAssignment._id.toString(),
          },
        };
  
        await this.notificationService.createNotification(notification);

        return { newAssignment, updatedAttendee };
      } else {
        throw new NotFoundException(
          'No eligible employees available for assignment.',
        );
      }
    }
  }

  async pullbackAssignment(id: string, adminId: string): Promise<any> {
    try {
      const assignment = await this.assignmentsModel.findOne({
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      });
      assignment.status = AssignmentStatus.INACTIVE;
      await assignment.save();
      const attendee = await this.attendeeModel.findOne({
        _id: new Types.ObjectId(`${assignment.attendee}`),
      });
      attendee.assignedTo = new Types.ObjectId(`${adminId}`);
      await attendee.save();
      return { assignment, attendee };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Faced an error pulling back the assignment, Please try again later.',
      );
    }
  }

  async getPullbacks(
    webinar: string,
    adminId: string,
    page: number,
    limit: number,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const result = await this.attendeeModel
      .find({
        webinar: new Types.ObjectId(`${webinar}`),
        assignedTo: new Types.ObjectId(`${adminId}`),
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    return result;
  }

  async getActiveInactiveAssignments(id: string): Promise<any> {
    console.log(id);
    const pipeline: PipelineStage[] = [
      {
        // Step 1: Match active assignments in the given date range (status: 'active')
        $match: {
          user: new Types.ObjectId(`${id}`),
          // status: 'active',
        },
      },
      {
        // Step 2: Lookup the Attendee details (by attendee field in assignments)
        $lookup: {
          from: 'attendees', // Collection name for Attendees
          localField: 'attendee', // Field in Assignments collection
          foreignField: '_id', // Field in Attendees collection
          as: 'attendeeDetails',
        },
      },
      {
        // Step 3: Unwind the attendeeDetails array to access attendee fields
        $unwind: {
          path: '$attendeeDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Step 4: Lookup Notes collection to fetch call duration based on attendee email
        $lookup: {
          from: 'notes', // Collection name for Notes
          let: {
            attendeeEmail: '$attendeeDetails.email', // Pass attendee email
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$email', '$$attendeeEmail'] }, // Match email with attendee email
                    { $eq: ['$createdBy', new Types.ObjectId(id)] }, // Match createdBy with user ID
                  ],
                },
              },
            },
          ],
          as: 'notesDetails',
        },
      },
      {
        // Step 5: Unwind notesDetails array to access call duration
        $unwind: {
          path: '$notesDetails',
          preserveNullAndEmptyArrays: true, // Keep assignments even if no matching notes found
        },
      },
      {
        // Step 6: Add field to calculate call duration in seconds
        $addFields: {
          callDurationInSeconds: {
            $add: [
              {
                $multiply: [
                  {
                    $toInt: { $ifNull: ['$notesDetails.callDuration.hr', '0'] },
                  },
                  3600,
                ],
              },
              {
                $multiply: [
                  {
                    $toInt: {
                      $ifNull: ['$notesDetails.callDuration.min', '0'],
                    },
                  },
                  60,
                ],
              },
              { $toInt: { $ifNull: ['$notesDetails.callDuration.sec', '0'] } },
            ],
          },
        },
      },
      {
        // Step 7: Lookup to fetch minCallTime from the User collection based on the assigned user
        $lookup: {
          from: 'users', // Collection name for Users
          localField: 'user', // The user field in assignments
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        // Step 8: Unwind the userDetails to access the minCallTime
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Step 9: Add eligibility field to check if the call is eligible based on minCallTime
        $addFields: {
          isEligible: {
            $gte: [
              '$callDurationInSeconds',
              { $ifNull: ['$userDetails.validCallTime', 0] }, // Check against minCallTime from user
            ],
          },
        },
      },
      {
        // Step 10: Group by assignment ID and determine eligible/ineligible based on notes
        $group: {
          _id: '$attendee',
          email: { $first: '$attendeeDetails.email' },
          webinar: { $first: '$attendeeDetails.webinar' },
          assignmentId: { $first: '$_id' },
          isEligible: { $max: '$isEligible' }, // If any note is eligible, set isEligible as true
        },
      },
      {
        $lookup: {
          from: 'webinars',
          localField: 'webinar',
          foreignField: '_id',
          as: 'webinarDetails',
        },
      },
      {
        $unwind: {
          path: '$webinarDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Step 11: Project the result with eligible and ineligible assignments
        $project: {
          assignmentId: 1,
          email: 1,
          isEligible: 1,
          webinar: '$webinarDetails.webinarName',
        },
      },
    ];

    const result = await this.assignmentsModel.aggregate(pipeline);
    return result;
  }

  async requestReAssignements(
    userId: string,
    adminId: string,
    assignments: string[],
    webinarId: string
  ) {
    const assignmentsIds = assignments.map(
      (assignment) => new Types.ObjectId(`${assignment}`),
    );
    const result = await this.assignmentsModel.updateMany(
      {
        adminId: new Types.ObjectId(`${adminId}`),
        user: new Types.ObjectId(`${userId}`),
        status: AssignmentStatus.ACTIVE,
        _id: { $in: assignmentsIds },
      },
      { $set: { status: AssignmentStatus.REASSIGN_REQUESTED } },
    );

    const reassignmentCount = result.modifiedCount;

    if (reassignmentCount > 0) {
      await this.notificationService.createNotification({
        recipient: adminId,
        title: 'Reassignment Requests Submitted',
        message: `${reassignmentCount} reassignment requests have been submitted.`,
        type: notificationType.INFO,
        actionType: notificationActionType.REASSIGNMENT,
        metadata: {
          userId,
          reassignmentCount,
          type: 'request',
          webinarId
        },
      });
    }
    return result;
  }

  async getReAssignments(
    adminId: string,
    webinarId: string,
    recordType: RecordType,
    status: AssignmentStatus,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const pipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new Types.ObjectId(`${adminId}`),
          recordType: recordType,
          status: status,
          webinar: new Types.ObjectId(`${webinarId}`),
        },
      },
      {
        $lookup: {
          from: 'attendees',
          localField: 'attendee',
          foreignField: '_id',
          as: 'attendeeDetails',
        },
      },
      {
        $unwind: {
          path: '$attendeeDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          attendeeEmail: '$attendeeDetails.email',
          assignedTo: '$userDetails.userName',
        },
      },
      {
        $project: {
          attendeeDetails: 0,
          userDetails: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
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
    ];

    const result = await this.assignmentsModel.aggregate(pipeline);
    console.log(result);
    return Array.isArray(result) && result.length > 0
      ? result[0]
      : { result: [], page, totalPages: 0 };
  }

  async approveReAssignments(
    adminId: string,
    assignments: string[],
    status: string,
    userId: string,
    webinarId: string
  ) {
    const assignmentsIds = assignments.map(
      (assignment) => new Types.ObjectId(`${assignment}`),
    );

    if (status === 'approved') {
      const session = await this.assignmentsModel.db.startSession();
      session.startTransaction();

      try {
        const updates = assignmentsIds.map(async (assignmentId) => {
          const updatedAssignment =
            await this.assignmentsModel.findOneAndUpdate(
              {
                adminId: new Types.ObjectId(`${adminId}`),
                _id: assignmentId,
              },
              { $set: { status: AssignmentStatus.REASSIGN_APPROVED } },
              { session }, // Add session to ensure transaction
            );

          if (!updatedAssignment) {
            throw new NotFoundException('Assignment not found');
          }

          const updatedAttendee = await this.attendeeModel.findOneAndUpdate(
            {
              adminId: new Types.ObjectId(`${adminId}`),
              _id: updatedAssignment.attendee,
            },
            { $set: { isPulledback: true } },
            { session }, // Add session to ensure transaction
          );

          if (!updatedAttendee) {
            throw new NotFoundException('Attendee not found');
          }

          return updatedAssignment;
        });

        const results = await Promise.all(updates);

        // Commit the transaction if everything succeeds
        await session.commitTransaction();
        session.endSession();

        await this.notificationService.createNotification({
          recipient: userId,
          title: 'Reassignment Request Approved',
          message: 'Your reassignment request has been approved.',
          type: notificationType.SUCCESS,
          actionType: notificationActionType.REASSIGNMENT,
          metadata: {
            type: 'request',
            webinarId: webinarId,
          },
        });

        return results;
      } catch (error) {
        // Abort the transaction in case of an error
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } else if (status === 'rejected') {
      // Using updateMany for rejected
      const result = await this.assignmentsModel.updateMany(
        {
          adminId: new Types.ObjectId(`${adminId}`),
          _id: { $in: assignmentsIds },
        },
        { $set: { status: AssignmentStatus.ACTIVE } },
      );
      await this.notificationService.createNotification({
        recipient: userId,
        title: 'Reassignment Request Rejected',
        message: 'Your reassignment request has been rejected.',
        type: notificationType.WARNING,
        actionType: notificationActionType.REASSIGNMENT,
        metadata: {
          type: 'request',
          webinarId: webinarId,
        },
      });
      return result;
    } else {
      throw new BadRequestException('Invalid status provided.');
    }
  }

  async changeAssignment(data: ReAssignmentDTO, adminId: string) {
    const session = await this.mongoConnection.startSession(); // Start a session
    session.startTransaction(); // Begin transaction

    try {
      const employee = await this.userService.getEmployee(data.employeeId);
      if (!employee || employee.adminId.toString() !== `${adminId}`) {
        throw new NotFoundException(
          'Employee not found or unauthorized access',
        );
      }
      if (employee.isActive === false) {
        throw new BadRequestException('Employee is inactive');
      }

      if (employee.adminId.toString() !== `${adminId}`) {
        throw new BadRequestException('Unauthorized access');
      }

      if (employee.dailyContactCount >= employee.dailyContactLimit) {
        throw new BadRequestException(
          'Employee has reached daily contact limit',
        );
      }

      const query = data.isTemp
        ? { tempAssignedTo: employee._id }
        : { assignedTo: employee._id, tempAssignedTo: null };

      let updatedAssignmentsCount = 0;
      let updatedAttendeesCount = 0;
      const newAssignments = [];

      for (const assignment of data.assignments) {
        const assignmentId = new Types.ObjectId(assignment.assignmentId);
        const attendeeId = new Types.ObjectId(assignment.attendeeId);

        // Update assignment status to INACTIVE
        const updateAssignment = await this.assignmentsModel.updateOne(
          {
            _id: assignmentId,
            adminId: new Types.ObjectId(`${adminId}`),
            webinar: new Types.ObjectId(data.webinarId),
            attendee: attendeeId,
            recordType: data.recordType,
          },
          { $set: { status: AssignmentStatus.INACTIVE } },
          { session }, // Include session in the operation
        );
        if (updateAssignment.matchedCount === 0) {
          throw new NotFoundException(
            `Assignment with ID ${assignment.assignmentId} not found or unauthorized access`,
          );
        }
        updatedAssignmentsCount++;

        // Update attendee with the new assignment
        const updateAttendee = await this.attendeeModel.updateOne(
          {
            _id: attendeeId,
            adminId: new Types.ObjectId(`${adminId}`),
            webinar: new Types.ObjectId(data.webinarId),
            isAttended:
              data.recordType === RecordType.POST_WEBINAR ? true : false,
          },
          { $set: { isPulledback: false, ...query } },
          { session }, // Include session in the operation
        );
        if (updateAttendee.matchedCount === 0) {
          throw new NotFoundException(
            `Attendee with ID ${assignment.attendeeId} not found or unauthorized access`,
          );
        }
        updatedAttendeesCount++;

        // Create new assignment
        const createdAssignment = await this.assignmentsModel.create(
          [
            {
              adminId: new Types.ObjectId(`${adminId}`),
              user: employee._id,
              webinar: new Types.ObjectId(data.webinarId),
              attendee: attendeeId,
              recordType: data.recordType,
              status: AssignmentStatus.ACTIVE,
            },
          ],
          { session }, // Include session in the operation
        );

        if (!createdAssignment) {
          throw new InternalServerErrorException(
            'Failed to create a new assignment',
          );
        }
        newAssignments.push(createdAssignment);
      }

      await this.userService.incrementCount(
        employee._id.toString(),
        updatedAssignmentsCount,
      );

      await session.commitTransaction(); // Commit the transaction if all operations succeed
      session.endSession();

      await this.notificationService.createNotification({
        recipient: employee._id.toString(),
        title: 'New Tasks Assigned',
        message: `You have been assigned ${updatedAssignmentsCount} new tasks ${data.isTemp ? 'temporarily' : ''}. Please check your task list for details.`,
        type: notificationType.INFO,
        actionType: notificationActionType.REASSIGNMENT,
        metadata: {
          webinarId: data.webinarId,
        },
      });

      return {
        message: 'Reassignment completed successfully',
        updatedAssignmentsCount,
        updatedAttendeesCount,
        newAssignments,
      };
    } catch (error) {
      await session.abortTransaction(); // Roll back all changes if any operation fails
      session.endSession();
      throw new InternalServerErrorException(
        `An error occurred during reassignment: ${error.message}`,
      );
    }
  }

  async changeAttendeeAssignmentStatus(
    attendees: string[],
    adminId: string,
    webinarId: string,
    recordType: RecordType,
    employeeId?: string,
    isTemp?: boolean,
  ) {
    const attendeeIds = attendees.map(
      (attendee) => new Types.ObjectId(`${attendee}`),
    );
    console.log('attendeeIds', employeeId);
    // if employee ID not exists that means user chose the option to pullback all attendees Assignments
    if (!employeeId) {
      const session = await this.attendeeModel.db.startSession();
      session.startTransaction();

      try {
        const updatations = attendeeIds.map(async (attendeeId) => {
          const updatedAttendee = await this.attendeeModel.findOneAndUpdate(
            {
              adminId: new Types.ObjectId(`${adminId}`),
              webinar: new Types.ObjectId(`${webinarId}`),
              isAttended: recordType === RecordType.POST_WEBINAR,
              assignedTo: { $ne: null },
              _id: attendeeId,
            },
            { $set: { isPulledback: true } },
            { session },
          );

          if (!updatedAttendee) {
            throw new NotFoundException(
              `Attendee with id ${attendeeId} not found`,
            );
          }

          const updatedAssignment =
            await this.assignmentsModel.findOneAndUpdate(
              {
                attendee: attendeeId,
                adminId: new Types.ObjectId(`${adminId}`),
                webinar: new Types.ObjectId(`${webinarId}`),
                recordType: recordType,
                status: AssignmentStatus.ACTIVE,
              },
              {
                $set: {
                  status: AssignmentStatus.REASSIGN_APPROVED,
                },
              },
              { session },
            );

          if (!updatedAssignment) {
            throw new NotFoundException(
              `Assignment for attendee with id ${attendeeId} not found`,
            );
          }

          return updatedAssignment;
        });

        const results = await Promise.all(updatations);
        await session.commitTransaction();
        session.endSession();
        return results;
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } else {
      const assignments = await this.assignmentsModel.find({
        adminId: new Types.ObjectId(`${adminId}`),
        status: AssignmentStatus.ACTIVE,
        webinar: new Types.ObjectId(`${webinarId}`),
        recordType: recordType,
        attendee: { $in: attendeeIds },
      });

      if (!assignments || assignments.length === 0) {
        throw new NotFoundException(
          `No assignments found for the given webinar and adminId: ${webinarId} ${adminId}`,
        );
      }

      return await this.changeAssignment(
        {
          assignments: assignments.map((assignment) => ({
            attendeeId: assignment.attendee.toString(),
            assignmentId: assignment._id.toString(),
          })),
          employeeId: employeeId,
          webinarId: webinarId,
          recordType: recordType,
          isTemp: isTemp,
        },
        adminId,
      );
    }
  }
}
