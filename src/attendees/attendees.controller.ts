import {
  Body,
  Controller,
  Get,
  NotAcceptableException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Id } from 'src/decorators/custom.decorator';
import { AttendeesService } from './attendees.service';
import { CreateAttendeeDto } from './dto/attendees.dto';
import { Types } from 'mongoose';

@Controller('attendees')
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Get(':id')
  async getAttendees(
    @Param('id') webinarId: string,
    @Query() query: { page?: string; limit?: string; isAttended: string },
    @Id() adminId: string,
  ) {
    if (!query?.isAttended)
      throw new NotAcceptableException('isAttended search query is required');

    let isAttended: boolean;
    if (query?.isAttended === 'preWebinar') isAttended = false;
    if (query?.isAttended === 'postWebinar') isAttended = true;

    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;
    
    const result = await this.attendeesService.getAttendees(
      webinarId,
      adminId,
      isAttended,
      page,
      limit,
    );

    return result;
  }

  @Post()
  async addAttendees(
    @Id() adminId: string,
    @Body()
    body: { data: [CreateAttendeeDto]; webinarId: string; isAttended: boolean },
  ): Promise<any> {
    console.log(body);
    const data = body.data;
    const dataLen = data.length;
    for (let i = 0; i < dataLen; i++) {
      data[i].webinar = new Types.ObjectId(`${body.webinarId}`);
      data[i].isAttended = body.isAttended;
      data[i].adminId = new Types.ObjectId(`${adminId}`);
    }

    const result = await this.attendeesService.addAttendees(data);
    return result;
  }
}
