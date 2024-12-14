import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async addAssignment(
    assignmentDto: AssignmentDto[],
    employee,
    webinar,
  ): Promise<any> {
    //   //check if assignment type and employee type match
    //   const assignments = [];
    //   const failedAssignments = [];
    //   const assignmentDtoLength = assignmentDto.length;
    //   for (let i = 0; i < assignmentDtoLength; i++) {
    //     assignmentDto[i].adminId = employee.adminId;
    //     assignmentDto[i].user = employee._id;
    //     assignmentDto[i].webinar = webinar;
    //     const assignmentExists = await this.assignmentsModel.findOne({
    //       email: assignmentDto[i].email,
    //       webinar: new Types.ObjectId(`${webinar}`),
    //     });
    //     console.log({
    //       email: assignmentDto[i].email,
    //       webinar: new Types.ObjectId(`${webinar}`),
    //     })
    //     if (assignmentExists) {
    //       failedAssignments.push({
    //         attendee: assignmentDto[i],
    //         message: 'Attendee already assigned to another employee',
    //       });
    //       continue;
    //     }
    //     try {
    //       if (assignmentDto[i].recordType === 'preWebinar') {
    //         // assignment to reminder employees
    //         if (
    //           String(employee.role) ===
    //           this.configService.get('appRoles')['EMPLOYEE_REMINDER']
    //         ) {
    //           // reminder employee assignment logic
    //           const result = await this.assignmentsModel.create(assignmentDto[i]);
    //           assignments.push(result);
    //         } else {
    //           failedAssignments.push({
    //             attendee: assignmentDto[i],
    //             message:
    //               'Pre-Webinar records can only be assigned to Reminder Employee',
    //           });
    //         }
    //       } else if (assignmentDto[i].recordType === 'postWebinar') {
    //         // assignment to reminder employees
    //         if (
    //           String(employee.role) ===
    //           this.configService.get('appRoles')['EMPLOYEE_SALES']
    //         ) {
    //           // sales employee assignment logic
    //           const result = await this.assignmentsModel.create(assignmentDto[i]);
    //           assignments.push(result);
    //         } else {
    //           failedAssignments.push({
    //             attendee: assignmentDto[i],
    //             message:
    //               'Post-Webinar records can only be assigned to Sales Employee',
    //           });
    //         }
    //       } else {
    //         failedAssignments.push({
    //           attendee: assignmentDto[i],
    //           message: 'Record type must be Pre or Post Webinar.',
    //         });
    //       }
    //     } catch (error) {
    //       failedAssignments.push({
    //         attendee: assignmentDto[i],
    //         message: error,
    //       });
    //     }
    //   }
    //   return { assignments, failedAssignments };
  }

  async addPreWebinarAssignments(
    adminId: string,
    webinarId: string,
    attendee: CreateAttendeeDto,
    recordType: string = 'preWebinar',
  ) {
    const webinar = await this.webinarService.getWebinar(webinarId, adminId);

    if (!webinar) {
      return;
    }

    const existingAttendee = await this.attendeeModel.findOne({
      email: attendee.email,
      webinar: webinarId,
    });

    if (existingAttendee) {
      throw new BadRequestException('Attendee already exists.');
    }

    const attendeesCount = await this.attendeeService.getAttendeesCount(
      '',
      adminId,
    );

    const subscription =
      await this.subscriptionService.getSubscription(adminId);

    if (
      !subscription ||
      subscription.expiryDate < new Date() ||
      subscription.contactLimit <= attendeesCount
    ) {
      throw new ForbiddenException('You have reached your contact limit.');
    }

    const newAttendee = await this.attendeeService.addAttendees([attendee]);

    if (!newAttendee) {
      throw new InternalServerErrorException('Failed to add attendee.');
    }

    const lastAssigned = await this.attendeeService.checkPreviousAssignment(
      newAttendee.email,
    );

    if (lastAssigned && lastAssigned.assignedTo) {
      const isEmployeeAssignedToWebinar = webinar.assignedEmployees.includes(
        lastAssigned.assignedTo,
      );

      if (isEmployeeAssignedToWebinar) {
        const employee = await this.userService.getEmployee(
          lastAssigned.assignedTo.toString(),
        );

        if (
          employee &&
          employee.dailyContactLimit < employee.dailyContactCount
        ) {
          const newAssignment = await this.assignmentsModel.create({
            adminId: adminId,
            webinar: webinar._id,
            attendee: newAttendee._id,
            user: employee._id,
            recordType: recordType,
          });

          if (!newAssignment) {
            throw new InternalServerErrorException('Failed to add assignment.');
          }

          const isDecremented = await this.userService.decrementCount(
            employee._id.toString(),
          );

          if (!isDecremented) {
            throw new InternalServerErrorException(
              'Failed to decrement count.',
            );
          }

          return { newAssignment, newAttendee };
        }
      }
    }
  }
}
