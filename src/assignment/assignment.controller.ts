import {
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
import { AssignmentDto, preWebinarAssignmentDto } from './dto/Assignment.dto';
import { UsersService } from 'src/users/users.service';
import { AssignmentService } from './assignment.service';
import { AdminId, Id } from 'src/decorators/custom.decorator';

@Controller('assignment')
export class AssignmentController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assignmentService: AssignmentService,
  ) {}

  @Get()
  async getEmployeeAssignments(
    @AdminId() adminId: string,
    @Id() employeeId: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;
    const result = await this.assignmentService.getAssignments(
      adminId,
      employeeId,
      page,
      limit,
    );
    return result;
  }

  @Get(':id')
  async getAssignments(
    @Id() adminId: string,
    @Param('id') id: string,
    @Query() query: { page?: string; limit?: string },
  ): Promise<any> {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;
    const result = await this.assignmentService.getAssignments(
      adminId,
      id,
      page,
      limit,
    );

    return result;
  }

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

    console.log(body.assignments);

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
    console.log('---> prewebinar', adminId);

    return await this.assignmentService.addPreWebinarAssignments(
      adminId,
      body.webinar,
      body.attendee,
    );
  }

  @Patch('pullback')
  async pullbackAssignment(
    @Body('id') id: string,
    @Id() adminId: string
  ):Promise<any> {
    const result = await this.assignmentService.pullbackAssignment(id, adminId)
    return result
  }

}
