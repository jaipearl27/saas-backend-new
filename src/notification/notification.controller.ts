import { Controller, Get, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from 'src/schemas/notification.schema';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/:recipient') 
  async getNotification(
    @Param('recipient') recipient: string,
  ): Promise<Notification[]> {
    return await this.notificationService.getUsernotifications(recipient);
  }
}
