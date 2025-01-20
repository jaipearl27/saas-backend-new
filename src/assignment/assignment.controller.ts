import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotAcceptableException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AssignmentDto,
  FetchReAssignmentsDTO,
  GetAssignmentDTO,
  MoveToPullbacksDTO,
  preWebinarAssignmentDto,
  ReAssignmentDTO,
  RequestReAssignmentsDTO,
} from './dto/Assignment.dto';
import { UsersService } from 'src/users/users.service';
import { AssignmentService } from './assignment.service';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { AssignmentStatus } from 'src/schemas/Assignments.schema';

@Controller('assignment')
export class AssignmentController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assignmentService: AssignmentService,
  ) {}

  @Post('data/:empId')
  async getEmployeeAssignments(
    @Param('empId') employee: string,
    @AdminId() admin: string,
    @Body() body: GetAssignmentDTO,
    @Id() id: string,
    @Query() query: { page?: string; limit?: string; webinarId?: string },
  ) {
    let employeeId = '';
    let adminId = '';

    if (String(employee) === String(id)) {
      employeeId = employee;
      adminId = admin;
      if (!query.webinarId || query.webinarId.trim() === '')
        throw new NotAcceptableException('Webinar ID is required');
    } else {
      const userEmployee = await this.usersService.getEmployee(employee);
      if (!userEmployee) {
        throw new NotFoundException('Employee not found');
      }
      if (String(userEmployee?.adminId) !== String(id)) {
        throw new UnauthorizedException(
          "You are not authorized to access this employee's data",
        );
      }
      employeeId = employee;
      adminId = id;

    }
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;

    const result = await this.assignmentService.getAssignments(
      adminId,
      employeeId,
      page,
      limit,
      body.filters,
      query.webinarId,
      body.validCall,
      body.assignmentStatus,
    );
    return result;
  }

  @Post('fetch-reassignments')
  async getReAssignments(
    @Id() admin: string,
    @Body() body: GetAssignmentDTO,
    @Query() query: { page?: string; limit?: string },
  ) {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;
    const result = await this.assignmentService.getAssignments(
      admin,
      '',
      page,
      limit,
      body.filters,
      body.webinarId,
      null,
      AssignmentStatus.REASSIGN_REQUESTED,
    );
    return result;
  }

  @Get('/activityInactivity')
  async getActiveInactiveAssignments(
    @Id() id: string,
    @Query('empId') empId: string,
  ): Promise<any> {
    const result = await this.assignmentService.getActiveInactiveAssignments(
      empId || id,
    );
    return result;
  }

  // @Get(':id')
  // async getAssignments(
  //   @Id() adminId: string,
  //   @Param('id') id: string,
  //   @Query() query: { page?: string; limit?: string },
  // ): Promise<any> {
  //   let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
  //   let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;
  //   const result = await this.assignmentService.getAssignments(
  //     adminId,
  //     id,
  //     page,
  //     limit,
  //   );

  //   return result;
  // }

  @Post()
  async addAssignment(
    @Body()
    body: { webinar: string; employee: string; assignments: [AssignmentDto] },
    @Id() adminId: string,
  ): Promise<any> {
    // check if employee is of this admin
    const employee = await this.usersService.getUserById(body.employee);

    if (!employee)
      throw new NotFoundException('No Employee found with this ID');

    if (String(employee.adminId) !== String(adminId)) {
      throw new UnauthorizedException(
        'Admin can only assign to their employees.',
      );
    }

    //continue assignment
    const result = await this.assignmentService.addAssignment(
      body.assignments,
      employee,
      body.webinar,
    );

    return result;
  }

  @Post('/prewebinar')
  async addPreWebinarAssignment(
    @Body() body: preWebinarAssignmentDto,
    @Id() adminId: string,
  ): Promise<any> {
    return await this.assignmentService.addPreWebinarAssignments(
      adminId,
      body.webinar,
      body.attendee,
    );
  }

  @Patch('reassign')
  async reassignAssignment(
    @Body() body: RequestReAssignmentsDTO,
    @AdminId() adminId: string,
    @Id() userId: string,
  ) {
    if(!body.requestReason){
      throw new BadRequestException("Reason is Required.")
    }

    return await this.assignmentService.requestReAssignements(
      userId,
      adminId,
      body.assignments,
      body.webinarId,
      body.requestReason
    );
  }

  @Patch('reassign/approve')
  async approveReassignment(
    @Body() body: RequestReAssignmentsDTO,
    @Id() adminId: string,
  ) {
    if (!body.status) {
      throw new NotAcceptableException('Status is required');
    }

    return await this.assignmentService.approveReAssignments(
      adminId,
      body.assignments,
      body.status,
      body.userId,
      body.webinarId
    );
  }

  @Patch('reassign/change')
  async changeReassignment(
    @Body() body: ReAssignmentDTO,
    @Id() adminId: string,
  ) {
    return await this.assignmentService.changeAssignment(body, adminId);
  }

  @Patch('reassign/pullback')
  async movieToPullbacks(
    @Body() body: MoveToPullbacksDTO,
    @Id() adminId: string,
  ) {
    return await this.assignmentService.changeAttendeeAssignmentStatus(
      body.attendees,
      adminId,
      body.webinarId,
      body.recordType,
      body.employeeId,
      body.isTemp
    );
  }

  @Post('reassign/fetch')
  async fetchReAssignments(
    @Body() body: FetchReAssignmentsDTO,
    @Id() adminId: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;
    return await this.assignmentService.getReAssignments(
      adminId,
      body.webinarId,
      body.recordType,
      body.status,
      page,
      limit,
    );
  }
}
