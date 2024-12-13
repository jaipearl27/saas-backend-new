import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignments } from 'src/schemas/Assignments.schema';
import { AssignmentDto } from './dto/Assignment.dto';
import { ConfigService } from '@nestjs/config';
import { assign } from 'nodemailer/lib/shared';
import { CreateAttendeeDto } from 'src/attendees/dto/attendees.dto';
import { Attendee } from 'src/schemas/Attendee.schema';
import { WebinarService } from 'src/webinar/webinar.service';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(Assignments.name) private assignmentsModel: Model<Assignments>,
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
    private readonly configService: ConfigService,
    private readonly webinarService: WebinarService,
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

    const availableEmployee = webinar.assignedEmployees
    .filter((employee: any) => employee.role === this.configService.get('appRoles')['EMPLOYEE_REMINDER'] && employee.dailyContactLimit <= employee.dailyContactLimit)
    .sort((a: any, b: any) => a.dailyAssignmentCount - b.dailyAssignmentCount)
    .shift();

    const existingAttendee = await this.attendeeModel.findOne({
      email: attendee.email,
      webinar: webinarId,
    });

    if (existingAttendee) {
      const existingAssignment = await this.assignmentsModel.findOne({
        attendee: new Types.ObjectId(`${existingAttendee._id}`),
        webinar: new Types.ObjectId(`${webinarId}`),
      });

      if (existingAssignment) {
        return;
      }
    }

    const newAttendee = await this.attendeeModel.create(attendee);
  }
}
