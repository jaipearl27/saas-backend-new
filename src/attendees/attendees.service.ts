import {
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

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Assignments.name)
    private readonly assignmentsModel: Model<Assignments>,
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {}

  async addAttendees(attendees: [CreateAttendeeDto]): Promise<any> {
    const result = await this.attendeeModel.create(attendees);
    return result;
  }

  async addPostAttendees(
    attendees: [CreateAttendeeDto],
    webinar?: any,
  ): Promise<any> {
    const result = await this.attendeeModel.insertMany(attendees);

    const resultLen = result?.length || 0;

    const assignments = [];

    for (let i = 0; i < resultLen; i++) {
      // Check if the attendee was previously assigned to an employee
      const lastAssigned = await this.checkPreviousPostAssignment(
        result[i].email,
      );

      if (lastAssigned && lastAssigned.assignedTo) {
        const isEmployeeAssignedToWebinar = webinar.assignedEmployees.some(
          (employee) => {
            return (
              employee._id.toString() === lastAssigned.assignedTo.toString() &&
              employee.role.toString() ===
                this.configService.get('appRoles')['EMPLOYEE_SALES']
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
              adminId: new Types.ObjectId(`${webinar?.adminId}`),
              webinar: new Types.ObjectId(`${webinar._id}`),
              attendee: result[i]._id,
              user: employee._id,
              recordType: 'postWebinar',
            });

            assignments.push(newAssignment);

            // Decrement the employee's daily contact count
            const isDecremented = await this.userService.incrementCount(
              employee._id.toString(),
            );

            if (!isDecremented) {
              throw new InternalServerErrorException(
                'Failed to update employee contact count.',
              );
            }

            const updatedAttendee = await this.updateAttendeeAssign(
              result[i]._id.toString(),
              employee._id.toString(),
            );

            if (!updatedAttendee) {
              throw new InternalServerErrorException(
                'Failed to update employee contact count.',
              );
            }
          }
        }
      }
    }

    return { result, assignments };
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
    console.log('hassFilts ===> ', hasFilters, filters);

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

  async checkPreviousPostAssignment(email: string): Promise<Attendee | null> {
    const lastAssigned = await this.attendeeModel
      .findOne({ email, isAttended: true })
      .sort({ createdAt: -1 })
      .skip(1)
      .exec();

    return lastAssigned;
  }
}
