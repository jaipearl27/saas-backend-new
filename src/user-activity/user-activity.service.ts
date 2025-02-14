import { Injectable } from '@nestjs/common';
import {
  CreateUserActivityDto,
  InactiviUserDTO,
} from './dto/user-activity.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserActivity } from 'src/schemas/UserActivity.schema';
import { Model, Types } from 'mongoose';
import { NotificationService } from 'src/notification/notification.service';
import {
  notificationActionType,
  notificationType,
} from 'src/schemas/notification.schema';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectModel(UserActivity.name)
    private readonly userActivityModel: Model<UserActivity>,
    private readonly notificationService: NotificationService,
  ) {}

  async addUserActivity(
    user: string,
    adminId: string,
    dto: CreateUserActivityDto,
  ) {
    if (!user || !adminId) {
      throw new Error('User ID and Admin ID are required.');
    }

    return this.userActivityModel.create({
      user: new Types.ObjectId(user),
      adminId: new Types.ObjectId(adminId),
      action: dto.action,
      details: dto.details || '',
    });
  }

  async getUserActivitiesByUser(
    userId: Types.ObjectId,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const activities = await this.userActivityModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('action details createdAt updatedAt');

    const totalActivities = await this.userActivityModel.countDocuments({
      user: userId,
    });

    return {
      data: activities,
      pagination: {
        totalActivities,
        totalPages: Math.ceil(totalActivities / limit),
        currentPage: page,
        pageSize: activities.length,
      },
    };
  }

  async sendInactivityNotification(adminId: string, body: InactiviUserDTO) {
    const notification = {
      recipient: adminId,
      title: 'User Inactivity Alert',
      message: `User ${body.userName} (${body.email}) has been inactive for a while.`,
      type: notificationType.INFO,
      actionType: notificationActionType.USER_ACTIVITY,
      metadata: {
        userId: body.userId,
        email: body.email,
        userName: body.userName,
      },
    };

    await this.notificationService.createNotification(notification);

    return [];
  }
}
