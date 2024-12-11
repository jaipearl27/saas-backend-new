import {
  Body,
  Controller,
  Get,
  NotAcceptableException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { AttendeesService } from './attendees.service';
import { AttendeesFilterDto, CreateAttendeeDto, UpdateAttendeeDto } from './dto/attendees.dto';
import { Types } from 'mongoose';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Controller('attendees')
export class AttendeesController {
  constructor(
    private readonly attendeesService: AttendeesService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post(':id')
  async getAttendees(
    @Param('id') webinarId: string,
    @Query() query: { page?: string; limit?: string; isAttended: string },
    @AdminId() adminId: string,
    @Body() body: { filters: AttendeesFilterDto },
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
      body.filters,
    );

    return result;
  }

  @Get()
  async getAllAttendees(
    @Query() query: { page?: string; limit?: string },
    @AdminId() adminId: string,
  ) {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;

    const result = await this.attendeesService.getAttendees(
      '',
      adminId,
      true,
      page,
      limit,
    );

    return result;
  }


  @Post('all')
  async getAllAttendeesForFilters(
    @Query() query: { page?: string; limit?: string },
    @AdminId() adminId: string,
    @Body() filters: AttendeesFilterDto
  ) {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;

    const result = await this.attendeesService.getAttendees(
      '',
      adminId,
      true,
      page,
      limit,
      filters
    );

    return result;
  }

  @Post()
  async addAttendees(
    @Id() adminId: string,
    @Body()
    body: { data: [CreateAttendeeDto]; webinarId: string; isAttended: boolean },
  ): Promise<any> {
    const data = body.data;

    //add reminder type attendees
    if (!body.isAttended) {
      // !!!! test if any data exists in postWebinar here !!!!
      const postWebinarExists =
        await this.attendeesService.getPostWebinarAttendee(
          body.webinarId,
          adminId,
        );

      if (postWebinarExists)
        throw new NotAcceptableException(
          'Cannot add Pre-Webinar data as it already exists in Post-Webinar.',
        );
    }

    //Inserting data here:
    const dataLen = data.length;

    //CHECK IF CONTACT LIMIT ALLOWS DATA TO BE ADDED:-

    const contactsUploaded = await this.attendeesService.getAttendeesCount(
      body.webinarId,
      adminId,
    );

    const subscription =
      await this.subscriptionService.getSubscription(adminId);
    const contactsLimit = 10;

    if (contactsUploaded + dataLen > contactsLimit)
      throw new NotAcceptableException(
        `${dataLen} contacts being uploaded exceed the contact limit of ${contactsLimit}, Please upgrade your plan or upload within the limit.`,
      );

    for (let i = 0; i < dataLen; i++) {
      data[i].webinar = new Types.ObjectId(`${body.webinarId}`);
      data[i].isAttended = body.isAttended;
      data[i].adminId = new Types.ObjectId(`${adminId}`);
    }

    const result = await this.attendeesService.addAttendees(data);
    return result;
  }

  @Patch(':id')
  async updateAttendee(
    @Param('id') id: string,
    @Body() updateAttendeeDto: UpdateAttendeeDto,
    @AdminId() adminId: string,
  ): Promise<any> {
    const result = await this.attendeesService.updateAttendee(
      id,
      adminId,
      updateAttendeeDto,
    );
    return result;
  }
}
