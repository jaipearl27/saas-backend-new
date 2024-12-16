import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Assignments } from 'src/schemas/Assignments.schema';
import { AssignmentDto } from './dto/Assignment.dto';
import { ConfigService } from '@nestjs/config';
import { assign } from 'nodemailer/lib/shared';
import { CreateAttendeeDto } from 'src/attendees/dto/attendees.dto';
import { Attendee } from 'src/schemas/Attendee.schema';
import { WebinarService } from 'src/webinar/webinar.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { AttendeesService } from 'src/attendees/attendees.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(Assignments.name) private assignmentsModel: Model<Assignments>,
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
    private readonly configService: ConfigService,
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
  ): Promise<any> {
    const skip = (page - 1) * limit;
  
    const pipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
          user: new Types.ObjectId(id),
          recordType: 'preWebinar', // Assuming recordType is part of the filter
          // webinar: new Types.ObjectId('675c0ef0e4aced8db727a032'), // Replace with dynamic webinar ID if needed
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
      { $skip: skip },
      { $limit: limit },
      { $sort: { updatedAt: -1 } }, // Sort by updatedAt
    ];
  
    const totalDocuments = await this.assignmentsModel.countDocuments([pipeline[0]]);
  
    const totalPages = Math.ceil(totalDocuments / limit) || 1;
  
    const result = await this.assignmentsModel.aggregate(pipeline).exec();
  
    return { totalPages, page, result };
  }
  

  async addAssignment(
    assignmentDto: AssignmentDto[],
    employee,
    webinar,
  ): Promise<any> {
      //check if assignment type and employee type match
      const assignments = [];
      const failedAssignments = [];
      const assignmentDtoLength = assignmentDto.length;
      for (let i = 0; i < assignmentDtoLength; i++) {
        assignmentDto[i].adminId = employee.adminId;
        assignmentDto[i].user = employee._id;
        assignmentDto[i].webinar = webinar;
        const assignmentExists = await this.assignmentsModel.findOne({
          attendee: new Types.ObjectId(`${assignmentDto[i].attendee}`),
          webinar: new Types.ObjectId(`${webinar}`),
        });
        if (assignmentExists) {
          failedAssignments.push({
            attendee: assignmentDto[i],
            message: 'Attendee already assigned to another employee',
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

          // Decrement the employee's daily contact count
          const isDecremented = await this.userService.incrementCount(
            employee._id.toString(),
          );

          if (!isDecremented) {
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
        (a, b) => a.difference - b.difference,
      ); // Sort by the smallest remaining capacity first


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

        // Decrement the employee's daily contact count
        const isDecremented = await this.userService.incrementCount(
          employee._id.toString(),
        );

        if (!isDecremented) {
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

        return { newAssignment, updatedAttendee };
      } else {
        throw new NotFoundException(
          'No eligible employees available for assignment.',
        );
      }
    }
  }
}