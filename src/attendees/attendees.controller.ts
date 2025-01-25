import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  NotAcceptableException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { AttendeesService } from './attendees.service';
import {
  AttendeesFilterDto,
  CreateAttendeeDto,
  GetAttendeesDTO,
  SwapAttendeeFieldsDTO,
  UpdateAttendeeDto,
} from './dto/attendees.dto';
import { Types } from 'mongoose';
import { WebinarService } from 'src/webinar/webinar.service';

@Controller('attendees')
export class AttendeesController {
  constructor(
    private readonly attendeesService: AttendeesService,
    @Inject(forwardRef(() => WebinarService))
    private readonly webinarService: WebinarService,
  ) {}

  @Get(':email')
  async getAttendee(
    @Param('email') email: string,
    @AdminId() adminId: string,
  ): Promise<any> {
    const result = await this.attendeesService.getAttendee(adminId, email);
    return result;
  }

  @Post('webinar')
  async getAttendees(
    @Query() query: { page?: string; limit?: string },
    @AdminId() adminId: string,
    @Body() body: GetAttendeesDTO,
  ) {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;

    const result = await this.attendeesService.getAttendees(
      body.webinarId || '',
      adminId,
      body.isAttended,
      page,
      limit,
      body.filters,
      body?.validCall,
      body?.assignmentType,
    );

    return result;
  }

  @Post('all')
  async getAllAttendeesForFilters(
    @Query() query: { page?: string; limit?: string },
    @AdminId() adminId: string,
    @Body() filters: AttendeesFilterDto,
  ) {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;

    const result = await this.attendeesService.getAttendees(
      '',
      adminId,
      true,
      page,
      limit,
      filters,
    );

    return result;
  }

  @Post()
  async addPostAttendees(
    @Id() adminId: string,
    @Body()
    body: { data: [CreateAttendeeDto]; webinarId: string; isAttended: boolean },
  ): Promise<any> {
    const webinar = await this.webinarService.getWebinar(
      body.webinarId,
      adminId,
    );

    if (!webinar) {
      throw new NotFoundException('Webinar not found.');
    }

    const data = body.data;
    let postWebinarExists = null;
    //add reminder type attendees
    if (!body.isAttended) {
      // !!!! test if any data exists in postWebinar here !!!!
       postWebinarExists =
        await this.attendeesService.getPostWebinarAttendee(
          body.webinarId,
          adminId,
        );

      if (postWebinarExists)
        throw new NotAcceptableException(
          'Cannot add Pre-Webinar data as it already exists in Post-Webinar.',
        );
    }

    for (let i = 0; i < data.length; i++) {
      data[i].webinar = new Types.ObjectId(`${body.webinarId}`);
      data[i].isAttended = body.isAttended;
      data[i].adminId = new Types.ObjectId(`${adminId}`);
    }

    const result = await this.attendeesService.addPostAttendees(
      data,
      body.webinarId,
      body.isAttended,
      adminId,
      postWebinarExists ? true : false,
    );
    return result;
  }

  @Patch(':id')
  async updateAttendee(
    @Param('id') id: string,
    @Body() updateAttendeeDto: UpdateAttendeeDto,
    @AdminId() adminId: string,
    @Id() userId: string,
  ): Promise<any> {
    const result = await this.attendeesService.updateAttendee(
      id,
      adminId,
      userId,
      updateAttendeeDto,
    );
    return result;
  }

  @Put('/swap')
  async swapAttendees(
    @Body() body: SwapAttendeeFieldsDTO,
    @Id() adminId: string,
  ) {
    return await this.attendeesService.swapFields(
      body.attendees,
      body.field1,
      body.field2,
      adminId,
    );
  }
}
