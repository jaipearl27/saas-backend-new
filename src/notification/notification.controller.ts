import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from 'src/schemas/notification.schema';
import { Id } from 'src/decorators/custom.decorator';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/:recipient') 
  async getNotification(
    @Param('recipient') recipient: string,
  ): Promise<Notification[]> {
    return await this.notificationService.getUsernotifications(recipient);
  }

  @Patch('/unseen')
  async unseenNotification(
    @Id() recipient: string
  ) {
    return await this.notificationService.resetUserUnseenCount(recipient);
  }
}
