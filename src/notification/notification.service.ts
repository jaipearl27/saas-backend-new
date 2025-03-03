import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import {
  Notification,
  notificationActionType,
} from 'src/schemas/notification.schema';
import { CreateNotificationDto } from './dto/notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { ClientSession } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const newNotification = new this.notificationModel(createNotificationDto);
    await newNotification.save();

    const socketId = this.websocketGateway.activeUsers.get(
      newNotification.recipient.toString(),
    );
    if (socketId)
      this.websocketGateway.server
        .to(socketId)
        .emit('notification', newNotification);

    return newNotification;
  }

  async getUsernotifications(
    recipient: string,
    page: number = 1,
    limit: number = 10,
    important: boolean = true,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const result = await this.notificationModel.aggregate([
      {
        $match: {
          recipient: new Types.ObjectId(`${recipient}`),
          actionType: important
            ? {
                $nin: [
                  notificationActionType.ATTENDEE_REGISTRATION,
                  notificationActionType.ASSIGNMENT,
                ],
              }
            : {
                $in: [
                  notificationActionType.ATTENDEE_REGISTRATION,
                  notificationActionType.ASSIGNMENT,
                ],
              },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          notifications: [{ $skip: skip }, { $limit: limit }],
          isSeenCount: [
            { $match: { isSeen: false } },
            { $count: 'unseenCount' },
          ],
        },
      },
      {
        $unwind: {
          path: '$isSeenCount',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$metadata',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          totalPages: { $ceil: { $divide: ['$metadata.total', limit] } },
          unseenCount: '$isSeenCount.unseenCount',
          page: { $literal: page },
        },
      },
      {
        $project: {
          notifications: 1,
          totalPages: 1,
          unseenCount: 1,
          page: 1,
        },
      },
    ]);

    if (result.length > 0) return result[0];
    return { notifications: [], totalPages: 1, unseenCount: 0, page: 1 };
  }

  async resetUserUnseenCount(recipient: string, important: boolean) {
    return await this.notificationModel.updateMany(
      {
        recipient: new Types.ObjectId(`${recipient}`),
        actionType: important
          ? {
              $nin: [
                notificationActionType.ATTENDEE_REGISTRATION,
                notificationActionType.ASSIGNMENT,
              ],
            }
          : {
              $in: [
                notificationActionType.ATTENDEE_REGISTRATION,
                notificationActionType.ASSIGNMENT,
              ],
            },
        isSeen: false,
      },
      {
        $set: { isSeen: true },
      },
    );
  }
  

  async deleteNotificationsByWebinar(
    webinarId: Types.ObjectId,
    session: ClientSession
  ) {
    return this.notificationModel.deleteMany(
      { 'metadata.webinarId': webinarId },
    ).session(session);
  }
}
