import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { User } from 'src/schemas/User.schema';
import { ConfigService } from '@nestjs/config';
import { CreateEmployeeDto } from 'src/auth/dto/createEmployee.dto';
import { CreatorDetailsDto } from 'src/auth/dto/creatorDetails.dto';
import { CreateClientDto } from 'src/auth/dto/createClient.dto';
import { Plans } from 'src/schemas/Plans.schema';
import { BillingHistoryService } from 'src/billing-history/billing-history.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { BillingHistoryDto } from 'src/billing-history/dto/bililngHistory.dto';
import { SubscriptionDto } from 'src/subscription/dto/subscription.dto';
import { UpdateUserInfoDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Plans.name) private plansModel: Model<Plans>,
    private configService: ConfigService,
    private readonly billingHistoryService: BillingHistoryService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  getUsers() {
    return this.userModel.find();
  }

  createUser(createUserDto: CreateUserDto) {
    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  async getClients(skip: number, limit: number): Promise<any> {
    const clientRoleId = this.configService.get('appRoles').ADMIN;

    const totalUsers = await this.userModel.countDocuments({
      role: new Types.ObjectId(`${clientRoleId}`),
    });

    console.log(totalUsers);

    const totalPages = Math.ceil(totalUsers / limit);

    const pipeline: mongoose.PipelineStage[] = [
      { $match: { role: new Types.ObjectId(`${clientRoleId}`) } },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'admin',
          as: 'subscription',
        },
      },
      {
        $lookup: {
          from: 'billinghistories',
          localField: '_id',
          foreignField: 'admin',
          as: 'billingHistory',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'adminId',
          as: 'employees',
        },
      },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan',
          foreignField: '_id',
          as: 'plan',
        },
      },

      {
        $addFields: {
          plan: {
            $arrayElemAt: ['$plan', 0],
          },
        },
      },
      {
        $lookup: {
          from: 'attendees',
          let: { adminId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$adminId', '$$adminId'] } } },
            { $count: 'totalCount' },
          ],
          as: 'contactsCount',
        },
      },

      {
        $addFields: {
          contactsCount: {
            $ifNull: [{ $arrayElemAt: ['$contactsCount.totalCount', 0] }, 0],
          },
        },
      },
      {
        $project: {
          password: 0,
        },
      },
      { $sort: { userName: 1 } },
      { $skip: skip || 0 },
      { $limit: limit || 25 },
    ];
    const result = await this.userModel.aggregate(pipeline);
    return { result, totalPages };
  }

  async getClient(id: string): Promise<any> {
    const pipeline: mongoose.PipelineStage[] = [
      { $match: { _id: new Types.ObjectId(`${id}`) } },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'admin',
          as: 'subscription',
        },
      },
      {
        $lookup: {
          from: 'billinghistories',
          localField: '_id',
          foreignField: 'admin',
          as: 'billingHistory',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'adminId',
          as: 'employees',
        },
      },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan',
          foreignField: '_id',
          as: 'plan',
        },
      },

      {
        $addFields: {
          plan: {
            $arrayElemAt: ['$plan', 0],
          },
        },
      },
      {
        $lookup: {
          from: 'attendees',
          let: { adminId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$adminId', '$$adminId'] } } },
            { $count: 'totalCount' },
          ],
          as: 'contactsCount',
        },
      },
      {
        $addFields: {
          contactsCount: {
            $ifNull: [{ $arrayElemAt: ['$contactsCount.totalCount', 0] }, 0],
          },
        },
      },
      {
        $project: {
          password: 0,
        },
      },
    ];

    const result = await this.userModel.aggregate(pipeline);
    return result;
  }

  async updateClient(
    id: string,
    updateUserInfoDto: UpdateUserInfoDto,
  ): Promise<any> {
 
    if (updateUserInfoDto.userName || updateUserInfoDto.email) {
   
      const isExisting = await this.userModel.findOne({
        $or: [
          { userName: updateUserInfoDto.userName },
          { email: updateUserInfoDto.email },
        ],
        _id: { $ne: id },
      });

 
      if (isExisting) {
        throw new NotAcceptableException('UserName/E-Mail already exists');
      }
    }

    const result = await this.userModel.findByIdAndUpdate(
      id,
      updateUserInfoDto,
      { new: true },
    );
    return result;
  }

  async updateClientStatus(id: string, statusChangeNote: string, isActive: boolean): Promise<any>{
    const result  = this.userModel.findByIdAndUpdate(id, {isActive, statusChangeNote}, {new: true})
    return result
  }

  getEmployees() {
    const clientRoleId = this.configService.get('appRoles').ADMIN;
    return this.userModel.find({
      role: new mongoose.Types.ObjectId(`${clientRoleId}`),
    });
  }

  async getUser(userName: string): Promise<any> {
    const user = await this.userModel.findOne({ userName: userName });
    return user;
  }

  getUserById(id: string) {
    return this.userModel.findById(id);
  }

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    const user = await this.userModel.create({
      ...createEmployeeDto,
      adminId: creatorDetailsDto.id,
    });
    return user;
  }

  async createClient(
    createClientDto: CreateClientDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    const plan = await this.plansModel.findOne({
      _id: new Types.ObjectId(`${createClientDto.plan}`),
    });

    if (!plan) throw new NotFoundException('No Plans Found with the given ID.');

    let date = new Date();
    let currentPlanExpiry = date.setDate(date.getDate() + plan.planDuration);
    createClientDto.currentPlanExpiry = currentPlanExpiry;

    /**
    // * test for date in frontend to be in IST
     * let date = new Date('2024-12-02T06:14:48.287Z')
      console.log(date.toLocaleString('en-IN'))
     */

    // Check if a user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { userName: createClientDto.userName },
        { email: createClientDto.email },
      ],
    });
    if (existingUser) {
      throw new BadRequestException(
        'User with this UserName/E-Mail already exists.',
      );
    }

    const user = await this.userModel.create({
      ...createClientDto,
      adminId: creatorDetailsDto.id,
    });

    //creating subscription and billing history initial entry

    let subscriptionPayload: SubscriptionDto = {
      admin: String(user._id),
      plan: String(plan._id),
      contactLimit: plan.contactLimit,
      expiryDate: currentPlanExpiry,
    };
    const subscription =
      await this.subscriptionService.addSubscription(subscriptionPayload);

    let billingHistoryPayload: BillingHistoryDto = {
      admin: String(user._id),
      plan: String(plan._id),
      amount: plan.amount,
    };
    const billingHistory = await this.billingHistoryService.addBillingHistory(
      billingHistoryPayload,
    );

    return { user, subscription, billingHistory };
  }
}
