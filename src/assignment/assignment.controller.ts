import { Body, Controller, Param, Post, UnauthorizedException } from '@nestjs/common';
import { AssignmentDto } from './dto/Assignment.dto';
import { UsersService } from 'src/users/users.service';
import { AssignmentService } from './assignment.service';
import { AdminId, Id, } from 'src/decorators/custom.decorator';

@Controller('assignment')
export class AssignmentController {

    constructor(
        private readonly usersService: UsersService,
        private readonly assignmentService: AssignmentService
    ){

    }

    @Post(':id')
    async addAssignment(
        @Body() body: {webinar: string, assignments: AssignmentDto[] },
        @Param('id') id: string,
        @Id() adminId: string
    ): Promise<any> {
        // check if employee is of this admin
        const employee = await this.usersService.getUserById(id)
    
        if(String(employee.adminId) !== String(adminId)) {
            throw new UnauthorizedException('Admin can only assign to their employees.')
        }

        //continue assignment
        const result = await this.assignmentService.addAssignment(body.assignments, employee, body.webinar)

        return result

    }
}
