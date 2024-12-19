import { Injectable } from '@nestjs/common';
import { CreateUserActivityDto } from './dto/user-activity.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserActivity } from 'src/schemas/UserActivity.schema';
import { Model, Types } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectModel(UserActivity.name)
    private readonly userActivityModel: Model<UserActivity>,
    private readonly mailerService: MailerService
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
      user : new Types.ObjectId(user),
      adminId : new Types.ObjectId(adminId),
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
      .find({  user: userId })
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

  async sendInactivityEmail( email: string) {

    const response = await this.mailerService
    .sendMail({
      to: 'copopoco71@gmail.com', // list of receivers
      from: 'anukulssdfsdyuyiuyiaxena@pearlorganisation.com', // sender address
      subject: 'Testsing Nest asasdasdMailerModule ✔', // Subject line
      text: 'welcome bhai tumhara employee mje maar rha hai', // plaintext body
      html: '<b>welcome welcome bhai tumhara employee mje maar rha hai</b>', // HTML body content
    })
    return response
  }
}
