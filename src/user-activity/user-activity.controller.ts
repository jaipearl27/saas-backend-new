// user-activity.controller.ts
import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { CreateUserActivityDto } from './dto/user-activity.dto';
import { UserActivityService } from './user-activity.service';
import { Types } from 'mongoose';

@Controller('user-activities')
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @Post()
  async addUserActivity(
    @Body() dto: CreateUserActivityDto,
    @Req() req: Request,
    @AdminId() adminId: string,
    @Id() id: string,
  ) {
    const newLog = await this.userActivityService.addUserActivity(
      id,
      adminId,
      dto,
    );

    return {
      statusCode: 201,
      message: 'User activity log added successfully.',
      data: newLog,
    };
  }

  @Get(':userId')
  async getUserActivitiesByUser(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {

    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const activities = await this.userActivityService.getUserActivitiesByUser(
      new Types.ObjectId(userId),
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );

    return {
      message: 'User activities for specified user ID',
      data: activities.data,
      pagination: activities.pagination,
    };
  }

  @Get()
  getUserActivities(
    @Req() req: Request,
    @AdminId() adminId: string,
    @Id() id: string,
  ) {
    console.log('Admin ID:', adminId);
    console.log('ID:', id);

    return { message: 'User activities retrieved', adminId, id };
  }
}