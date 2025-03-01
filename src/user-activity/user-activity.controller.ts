// user-activity.controller.ts
import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Put, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminId, Id, Role } from 'src/decorators/custom.decorator';
import { CreateUserActivityDto, InactiviUserDTO } from './dto/user-activity.dto';
import { UserActivityService } from './user-activity.service';
import { Types } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@Controller('user-activities')
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService
  ) {}

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
  async getUserActivities(
    @Req() req: Request,
    @AdminId() adminId: string,
    @Role() role: string,
    @Id() id: string,
    @Query('email') email: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    console.log('Admin ID:', adminId);
    console.log('ID:', id);
    let admin = "";
    const clientRoleId = this.configService.get('appRoles').ADMIN;

    if(role === clientRoleId){
      admin = id;
    }else{
      admin = adminId;
    }
    return await this.userActivityService.getUserActivitiesByAdmin(admin, email, parseInt(page) || 1, parseInt(limit) || 10);
  }

  @Put('inactive')
  async sendInactiveEmail(  
    @AdminId() adminId: string,
    @Body() body: InactiviUserDTO
  ){
    // const admin = await this.userService.getUserById(adminId);
    // if(!admin){
    //   throw new NotFoundException('Admin not found');
    // }
    return await this.userActivityService.sendInactivityNotification(adminId, body);
  }
}
