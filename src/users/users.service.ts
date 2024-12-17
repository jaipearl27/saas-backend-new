import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage, Types } from 'mongoose';
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
import * as bcrypt from 'bcrypt';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { Roles, RolesModel } from 'src/schemas/Roles.schema';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Subscription } from 'src/schemas/Subscription.schema';
import { JwtService } from '@nestjs/jwt';
import { GetClientsFilterDto } from './dto/filters.dto';
import { EmployeeFilterDTO } from './dto/employee-filter.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Roles.name) private rolesModel: Model<Roles>,
    @InjectModel(Plans.name) private plansModel: Model<Plans>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    private configService: ConfigService,
    private readonly billingHistoryService: BillingHistoryService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    private readonly jwtService: JwtService,
  ) {}

  getUsers() {
    return this.userModel.find();
  }

  createUser(createUserDto: CreateUserDto) {
    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  createClientPipeline(filterData: GetClientsFilterDto) {
    const matchFilters = {};
    if (filterData.email) matchFilters['email'] = filterData.email;
    if (filterData.companyName)
      matchFilters['companyName'] = filterData.companyName;
    if (filterData.userName) matchFilters['userName'] = filterData.userName;
    if (filterData.phone) matchFilters['phone'] = filterData.phone;
    if (filterData.isActive)
      matchFilters['isActive'] = filterData.isActive === 'active';

    const subscriptionFilter = {};
    if (filterData.planStartDate) {
      subscriptionFilter['startDate'] = {};
      if (filterData.planStartDate.$gte) {
        subscriptionFilter['startDate']['$gte'] = new Date(
          filterData.planStartDate.$gte,
        );
      }
      if (filterData.planStartDate.$lte) {
        subscriptionFilter['startDate']['$lte'] = new Date(
          filterData.planStartDate.$lte,
        );
      }
    }
    if (filterData.planExpiry) {
      subscriptionFilter['expiryDate'] = {};
      if (filterData.planExpiry.$gte) {
        subscriptionFilter['expiryDate']['$gte'] = new Date(
          filterData.planExpiry.$gte,
        );
      }
      if (filterData.planExpiry.$lte) {
        subscriptionFilter['expiryDate']['$lte'] = new Date(
          filterData.planExpiry.$lte,
        );
      }
    }
    if (filterData.contactsLimit) {
      subscriptionFilter['contactLimit'] = filterData.contactsLimit;
    }
    if (filterData.toggleLimit) {
      subscriptionFilter['toggleLimit'] = filterData.toggleLimit;
    }

    const planFilter = {};
    if (filterData.planName) planFilter['name'] = filterData.planName;

    const employeeCountFilter = {};
    if (filterData.totalEmployees) {
      employeeCountFilter['totalEmployees'] = filterData.totalEmployees;
    }
    if (filterData.employeeSalesCount) {
      employeeCountFilter['employeeSalesCount'] = filterData.employeeSalesCount;
    }
    if (filterData.employeeReminderCount) {
      employeeCountFilter['employeeReminderCount'] =
        filterData.employeeReminderCount;
    }

    const clientRoleId = this.configService.get('appRoles').ADMIN;
    const empSalesId = this.configService.get('appRoles').EMPLOYEE_SALES;
    const empReminderId = this.configService.get('appRoles').EMPLOYEE_REMINDER;
    return [
      {
        $match: {
          role: new Types.ObjectId(`${clientRoleId}`),
          ...matchFilters,
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'admin',
          pipeline: [
            {
              $match: subscriptionFilter,
            },
            {
              $project: {
                startDate: 1,
                expiryDate: 1,
                contactLimit: 1,
                toggleLimit: 1,
              },
            },
          ],
          as: 'subscription',
        },
      },
      {
        $unwind: { path: '$subscription', preserveNullAndEmptyArrays: false },
      },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan',
          foreignField: '_id',
          pipeline: [
            {
              $match: planFilter,
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: 'plan',
        },
      },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'adminId',
          as: 'employees',
        },
      },
      {
        $addFields: {
          planName: '$plan.name',
          planStartDate: '$subscription.startDate',
          planExpiry: '$subscription.expiryDate',
          contactsLimit: '$subscription.contactLimit',
          toggleLimit: '$subscription.toggleLimit',
          totalEmployees: { $size: '$employees' },
          employeeSalesCount: {
            $size: {
              $filter: {
                input: '$employees',
                as: 'emp',
                cond: {
                  $eq: ['$$emp.role', new Types.ObjectId(`${empSalesId}`)],
                },
              },
            },
          },
          employeeReminderCount: {
            $size: {
              $filter: {
                input: '$employees',
                as: 'emp',
                cond: {
                  $eq: ['$$emp.role', new Types.ObjectId(`${empReminderId}`)],
                },
              },
            },
          },
        },
      },
      {
        $match: employeeCountFilter,
      },
      {
        $project: {
          email: 1,
          companyName: 1,
          userName: 1,
          phone: 1,
          isActive: 1,
          planName: 1,
          planStartDate: 1,
          planExpiry: 1,
          contactsLimit: 1,
          toggleLimit: 1,
          totalEmployees: 1,
          employeeSalesCount: 1,
          employeeReminderCount: 1,
          contactsCount: 1,
        },
      },
    ];
  }

  async getClients(
    skip: number,
    limit: number,
    filterData: GetClientsFilterDto,
  ): Promise<any> {
    const pipeline = this.createClientPipeline(filterData);

    const totalUsersPipeline = [...pipeline, { $count: 'totalUsers' }];

    const totalUsersResult = await this.userModel.aggregate(totalUsersPipeline);
    const totalUsers = totalUsersResult[0]?.totalUsers || 0;
    const totalPages = Math.ceil(totalUsers / limit);

    const result = await this.userModel.aggregate([
      ...pipeline,
      { $skip: skip || 0 },
      { $limit: limit || 25 },
    ]);

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

    if (updateUserInfoDto.password) {
      const hashPassword = await bcrypt.hash(updateUserInfoDto.password, 10);
      updateUserInfoDto.password = hashPassword;
    }

    const result = await this.userModel.findByIdAndUpdate(
      id,
      updateUserInfoDto,
      { new: true },
    );
    return result;
  }

  async getEmployees(
    adminId: string, 
    page: number = 1, 
    limit: number = 10, 
    filters: EmployeeFilterDTO = {}
  ) {
    const skip = (page - 1) * limit;
  
    const pipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new mongoose.Types.ObjectId(adminId), // Match employees by adminId
          ...filters, // Spread filter conditions if any
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }], // Get the total count of matching documents
          data: [
            { $skip: skip }, // Skip the required number of documents for pagination
            { $limit: limit }, // Limit the number of results per page
          ],
        },
      },
      {
        $unwind: "$metadata", // Unwind to convert metadata array to object
      },
      {
        $project: {
          data: 1,
          totalPages: {
            $ceil: { $divide: ["$metadata.total", limit] }, // Calculate total pages
          },
          page: { $literal: page }, // Add current page info
        },
      },
    ];
  
    const result = await this.userModel.aggregate(pipeline).exec();
  
    return result[0] || { data: [], totalPages: 0, page: page };
  }
  

  getEmployee(id: string): Promise<User | null> {
    const employee = this.userModel.findById(id);

    return employee;
  }

  async getUser(userName: string): Promise<any> {
    const user = await this.userModel.findOne({ userName: userName });
    return user;
  }

  getUserById(id: string) {
    return this.userModel.findById(id);
  }

  async updateUser(
    id: string,
    updateUserInfoDto: UpdateUserInfoDto,
  ): Promise<any> {
    console.log(updateUserInfoDto);
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

    //deleting updateUserInfoDto unus
    delete updateUserInfoDto.password;
    delete updateUserInfoDto.isActive;
    delete updateUserInfoDto.statusChangeNote;
    // Append documents if provided
    if (updateUserInfoDto.documents?.length > 0) {
      const user = await this.userModel.findById(id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Combine existing documents with new ones
      const updatedDocuments = [
        ...(user.documents || []),
        ...updateUserInfoDto.documents,
      ];

      updateUserInfoDto.documents = updatedDocuments;
    }
    const result = await this.userModel.findByIdAndUpdate(
      id,
      updateUserInfoDto,
      { new: true },
    );
    return result;
  }

  async deleteDocument(id: string, filename: string): Promise<any> {
    const user = await this.userModel.findById(id);

    if (!user) throw new NotFoundException('No user found.');

    const documents = user.documents;

    const filteredDocuments = documents.filter(
      doc => doc.filename !== filename,
    );

    user.documents = filteredDocuments;
    const result = user.save();

    return result;
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<any> {
    const user = await this.userModel.findById(id);

    console.log(user);

    const verifyOldPassword = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );

    if (!verifyOldPassword)
      throw new NotAcceptableException(
        "Old password does not match the one in our database, If you don't recall it, please try Forgot Password option.",
      );

    if (updatePasswordDto.password !== updatePasswordDto.confirmPassword)
      throw new NotAcceptableException(
        'New password does not match, please enter correct one and try again.',
      );

    const newPassword = await bcrypt.hash(updatePasswordDto.password, 10);

    const result = await this.userModel.findByIdAndUpdate(
      id,
      { password: newPassword },
      { new: true },
    );
    return { message: 'Password updated successfully!' };
  }

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    const role = await this.rolesModel.findOne({
      name: createEmployeeDto?.role,
    });
    if (!role) throw new NotFoundException('No Role Found with the given ID.');

    const user = await this.userModel.create({
      ...createEmployeeDto,
      role: role._id,
      adminId: creatorDetailsDto.id,
    });
    return user;
  }

  async updateEmployee(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<any> {
    if (updateEmployeeDto.userName || updateEmployeeDto.email) {
      const isExisting = await this.userModel.findOne({
        $or: [
          { userName: updateEmployeeDto.userName },
          { email: updateEmployeeDto.email },
        ],
        _id: { $ne: id },
      });

      if (isExisting) {
        throw new NotAcceptableException('UserName/E-Mail already exists');
      }
    }

    if (updateEmployeeDto.password) {
      const hashPassword = await bcrypt.hash(updateEmployeeDto.password, 10);
      updateEmployeeDto.password = hashPassword;
    }
    const role = await this.rolesModel.findOne({
      name: updateEmployeeDto?.role,
    });

    if (!role) throw new NotFoundException('No Role Found with the given ID.');

    const result = await this.userModel.findByIdAndUpdate(
      id,
      {
        userName: updateEmployeeDto.userName,
        email: updateEmployeeDto.email,
        phone: updateEmployeeDto.phone,
        validCallTime: updateEmployeeDto.validCallTime,
        dailyContactLimit: updateEmployeeDto.dailyContactLimit,
        role: role._id,
      },
      { new: true },
    );
    return result;
  }

  async changeEmployeeStatus(
    userId: string,
    adminId: string,
    status: boolean,
  ): Promise<any> {
    const subscription = await this.subscriptionModel
      .findOne({ admin: new mongoose.Types.ObjectId(`${adminId}`) })
      .exec();

    if (!subscription) {
      throw new NotFoundException('No Subscription Found with the given ID.');
    }
    console.log('subsriptio ----> ', subscription);
    if (new Date(subscription.expiryDate) < new Date()) {
      throw new NotAcceptableException(
        'Your subscription has expired. Please renew your subscription to continue.',
      );
    }

    if (subscription.toggleLimit <= 0) {
      throw new NotAcceptableException('Your toggle limit has expired.');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('No User Found with the given ID.');
    }

    user.isActive = status;
    await user.save();

    subscription.toggleLimit = subscription.toggleLimit - 1;
    await subscription.save();
    return { message: 'Status updated successfully!', subscription };
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

    const userData = await this.userModel.create({
      ...createClientDto,
      adminId: creatorDetailsDto.id,
    });
    console.log(userData);

    const payload = {
      id: userData?._id,
      role: userData?.role,
      adminId: userData?.adminId,
      plan: userData?.plan,
    };

    //create jwt with payload here
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('PABBLY_CLIENT_ACCESS_TOKEN_SECRET'),
    });

    const user = await this.userModel
      .findByIdAndUpdate(
        String(userData?._id),
        { pabblyToken: token },
        { new: true },
      )
      .select('-password');

    //creating subscription and billing history initial entry

    let subscriptionPayload: SubscriptionDto = {
      admin: String(user._id),
      plan: String(plan._id),
      contactLimit: plan.contactLimit,
      toggleLimit: plan.toggleLimit,
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

  // Method to check expired plans and deactivate users
  async deactivateExpiredPlans(): Promise<void> {
    const now = new Date();
    const adminRole = this.configService.get('appRoles').ADMIN;
    try {
      const result = await this.userModel.updateMany(
        {
          currentPlanExpiry: { $lt: now },
          isActive: true,
          role: new Types.ObjectId(`${adminRole}`),
        },
        {
          $set: { isActive: false },
        },
      );
      //TODO: send email to super admin

      this.logger.log(
        `Deactivated ${result.modifiedCount} users with expired plans.`,
      );

      if (result.modifiedCount > 0) {
        const deactivatedAdminIds = await this.userModel
          .find(
            {
              currentPlanExpiry: { $lt: now },
              role: new Types.ObjectId(`${adminRole}`),
            },
            { _id: 1 },
          )
          .exec();

        const adminIds = deactivatedAdminIds.map((admin) => admin._id);
        console.log('adminIds', adminIds);

        const employeeResult = await this.userModel.updateMany(
          {
            adminId: { $in: adminIds },
            isActive: true,
          },
          {
            $set: { isActive: false },
          },
        );

        this.logger.log(
          `Deactivated ${employeeResult.modifiedCount} employees of ${result.modifiedCount} admins with expired plans.`,
        );
      }
    } catch (error) {
      this.logger.error('Error during plan deactivation:', error.message);
    }
  }

  async incrementCount(id: string): Promise<boolean> {
    const user = await this.userModel.findById(id).exec();
    if (user) {
      if(user.dailyContactCount)
      user.dailyContactCount -= 1;
      else
      user.dailyContactCount = 1;
      await user.save();
      return true;
    }
    return false;
  }
}
