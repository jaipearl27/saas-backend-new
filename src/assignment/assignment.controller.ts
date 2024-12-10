import { Body, Controller, Post } from '@nestjs/common';
import { AssignmentDto } from './dto/Assignment.dto';

@Controller('assignment')
export class AssignmentController {

    @Post()
    async assignment(
        @Body() assignmentDto: AssignmentDto
    ): Promise<any> {

    }
}
