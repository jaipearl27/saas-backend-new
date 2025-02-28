import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from 'src/schemas/notification.schema';
import { Id } from 'src/decorators/custom.decorator';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/:recipient')
  async getNotification(
    @Param('recipient') recipient: string,
    @Query() query: { page?: string; limit?: string; important: string },
  ): Promise<Notification[]> {
    const page = Number(query.page) ? Number(query.page) : 1;
    const limit = Number(query.limit) ? Number(query.limit) : 10;

    return await this.notificationService.getUsernotifications(
      recipient,
      page,
      limit,
      query.important === 'true',
    );
  }

  @Patch('/unseen')
  async unseenNotification(
    @Id() recipient: string,
    @Body('important') important: boolean,
  ) {
    return await this.notificationService.resetUserUnseenCount(recipient, important);
  }
}
