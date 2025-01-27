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
import mongoose, { ClientSession, Model, PipelineStage, Types } from 'mongoose';
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
import { CustomLeadTypeService } from 'src/custom-lead-type/custom-lead-type.service';
import { NotificationService } from 'src/notification/notification.service';
import {
  notificationActionType,
  notificationType,
} from 'src/schemas/notification.schema';
import exp from 'constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Roles.name) private rolesModel: Model<Roles>,
    @InjectModel(Plans.name) private plansModel: Model<Plans>,
    private configService: ConfigService,
    private readonly billingHistoryService: BillingHistoryService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    private readonly jwtService: JwtService,
    private readonly customLeadTypeService: CustomLeadTypeService,
    private readonly notificationService: NotificationService,
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
    if (filterData.contactsLimit) {
      employeeCountFilter['contactsLimit'] = filterData.contactsLimit;
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
                contactLimitAddon: 1,
                employeeLimit: 1,
                employeeLimitAddon: 1,
                contactCount: 1,
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
          usedContactsCount: '$subscription.contactCount',
          contactsLimit: {
            $add: [
              '$subscription.contactLimit',
              '$subscription.contactLimitAddon',
            ],
          },
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
        $addFields: {
          employeeLimit: {
            $add: [
              '$subscription.employeeLimit',
              '$subscription.employeeLimitAddon',
            ],
          },
          remainingDays: {
            $max: [
              {
                $floor: {
                  $divide: [
                    {
                      $subtract: [
                        { $toLong: '$subscription.expiryDate' },
                        { $toLong: new Date() },
                      ],
                    },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
              0,
            ],
          },
        },
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
          employeeLimit: 1,
          remainingDays: 1,
          usedContactsCount: 1,
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
        email: updateUserInfoDto.email,
        _id: { $ne: id },
      });

      if (isExisting) {
        throw new NotAcceptableException('E-Mail already exists');
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
    console.log(result._id, updateUserInfoDto.isActive);
    if (result && updateUserInfoDto.isActive === false) {
      await this.notificationService.createNotification({
        recipient: result._id.toString(),
        title: 'Account Deactivation Notice',
        message: `Your account has been deactivated. Please contact the super admin for more details.`,
        type: notificationType.INFO,
        actionType: notificationActionType.ACCOUNT_DEACTIVATION,
      });

      const employees = await this.userModel.find({
        adminId: result._id,
        isActive: true,
      });

      for (const employee of employees) {
        await this.userModel.findByIdAndUpdate(employee._id, {
          $set: { isActive: false },
        });

        await this.notificationService.createNotification({
          recipient: employee._id.toString(),
          title: 'Admin Account Deactivation Notice',
          message: `The admin account you are associated with has been deactivated. Please contact your admin for further instructions.`,
          type: notificationType.INFO,
          actionType: notificationActionType.ACCOUNT_DEACTIVATION,
        });
      }
    }

    return result;
  }

  async getEmployees(
    adminId: string,
    page: number = 1,
    limit: number = 10,
    filters: EmployeeFilterDTO = {},
  ) {
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new mongoose.Types.ObjectId(adminId),
        },
      },
      {
        $match: {
          ...(filters.email && {
            email: { $regex: filters.email, $options: 'i' },
          }),
          ...(filters.userName && {
            userName: { $regex: filters.userName, $options: 'i' },
          }),
          ...(filters.phone && {
            phone: { $regex: filters.phone, $options: 'i' },
          }),
          ...(filters.isActive && {
            isActive: filters.isActive === 'active',
          }),
          ...(filters.validCallTime && {
            validCallTime: filters.validCallTime,
          }),
          ...(filters.dailyContactLimit && {
            dailyContactLimit: filters.dailyContactLimit,
          }),
          ...(filters.role && { role: new Types.ObjectId(filters.role) }),
        },
      },
      {
        $lookup: {
          from: 'roles', // Collection name where roles are stored
          localField: 'role', // The field in the current collection
          foreignField: '_id', // The field in the roles collection
          as: 'roleInfo', // The resulting array field
        },
      },
      {
        $set: {
          role: { $arrayElemAt: ['$roleInfo.name', 0] }, // Replace `role` with the first matching `roleInfo.name`
        },
      },
      {
        $unset: 'roleInfo', // Remove the temporary `roleInfo` array
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
      {
        $unwind: '$metadata', // Unwind to convert metadata array to object
      },
      {
        $project: {
          result: '$data',
          totalPages: {
            $ceil: { $divide: ['$metadata.total', limit] }, // Calculate total pages
          },
          page: { $literal: page }, // Add current page info
        },
      },
    ];

    const result = await this.userModel.aggregate(pipeline).exec();

    return result[0] || { result: [], totalPages: 0, page: page };
  }

  async getEmployeesCount(AdminId: string): Promise<any> {
    const query = {
      adminId: new Types.ObjectId(`${AdminId}`),
    };

    const totalContacts = (await this.userModel.countDocuments(query)) || 0;

    return totalContacts;
  }

  getEmployee(id: string): Promise<User | null> {
    const employee = this.userModel.findById(id);

    return employee;
  }

  async getUser(email: string): Promise<any> {
    const user = await this.userModel.findOne({ email: email });
    return user;
  }

  async getUserById(id: string) {
    return await this.userModel.findById(id);
  }

  async updateUser(
    id: string,
    updateUserInfoDto: UpdateUserInfoDto,
  ): Promise<any> {
    // console.log(updateUserInfoDto);
    if (updateUserInfoDto.email) {
      const isExisting = await this.userModel.findOne({
        email: updateUserInfoDto.email,
        _id: { $ne: id },
      });

      if (isExisting) {
        throw new NotAcceptableException('E-Mail already exists');
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
      (doc) => doc.filename !== filename,
    );

    user.documents = filteredDocuments;

    //add logic for deleting file from server here

    const result = user.save();

    return result;
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<any> {
    const user = await this.userModel.findById(id);

    // console.log(user);

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
    console.log('creating Employee');
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
    if (updateEmployeeDto.email) {
      const isExisting = await this.userModel.findOne({
        email: updateEmployeeDto.email,
        _id: { $ne: id },
      });

      if (isExisting) {
        throw new NotAcceptableException('E-Mail already exists');
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
        inactivityTime: updateEmployeeDto.inactivityTime,
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
    const subscription: any =
      await this.subscriptionService.getSubscription(adminId);

    if (!subscription) {
      throw new NotFoundException('No Subscription Found with the given ID.');
    }

    if (subscription.toggleLimit <= 0) {
      throw new NotAcceptableException('Your toggle limit has expired.');
    }

    if (new Date(subscription.expiryDate) < new Date()) {
      throw new NotAcceptableException(
        'Your subscription has expired. Please renew your subscription to continue.',
      );
    }

    const totalEmployeeLimit =
      (subscription.employeeLimit ?? 0) +
      (subscription.employeeLimitAddon ?? 0);

    const existingEmpCount = await this.userModel.countDocuments({
      adminId: new Types.ObjectId(`${adminId}`),
      isActive: true,
    });

    if (existingEmpCount >= totalEmployeeLimit && status) {
      throw new NotAcceptableException('You have reached your employee limit');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('No User Found with the given ID.');
    }

    user.isActive = status;
    await user.save();

    subscription.toggleLimit = subscription.toggleLimit - 1;
    subscription.employeeLimit = subscription.employeeLimit || 0;
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
    let currentPlanExpiry = date.setDate(
      date.getDate() + createClientDto.planDuration,
    );
    createClientDto.currentPlanExpiry = currentPlanExpiry;

    /**
    // * test for date in frontend to be in IST
     * let date = new Date('2024-12-02T06:14:48.287Z')
      console.log(date.toLocaleString('en-IN'))
     */

    // Check if a user already exists
    const existingUser = await this.userModel.findOne({
      email: createClientDto.email,
    });
    if (existingUser) {
      throw new BadRequestException('User with this E-Mail already exists.');
    }

    const userData = await this.userModel.create({
      email: createClientDto.email,
      userName: createClientDto.userName,
      password: createClientDto.password,
      phone: createClientDto.phone,
      role: createClientDto.role,
      companyName: createClientDto.companyName,
      adminId: creatorDetailsDto.id,
    });
    // console.log(userData);

    const payload = {
      id: userData?._id,
      role: userData?.role,
      adminId: userData?.adminId,
    };

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

    let subscriptionPayload: SubscriptionDto = {
      admin: String(user._id),
      plan: String(plan._id),
      contactLimit: plan.contactLimit,
      employeeLimit: plan.employeeCount,
      toggleLimit: plan.toggleLimit,
      expiryDate: currentPlanExpiry,
    };

    const subscription =
      await this.subscriptionService.addSubscription(subscriptionPayload);

    let billingHistoryPayload = {
      admin: String(user._id),
      plan: String(plan._id),
      itemAmount: createClientDto.itemAmount,
      discountAmount: createClientDto.discountAmount,
      taxPercent: createClientDto.taxPercent,
      taxAmount: createClientDto.taxAmount,
      amount: createClientDto.totalAmount,
      durationType: createClientDto.durationType,
    };
    const billingHistory = await this.billingHistoryService.addBillingHistory(
      billingHistoryPayload,
    );

    await this.customLeadTypeService.createDefaultLeadTypes(`${user._id}`);

    return { user, subscription, billingHistory };
  }

  // Method to check expired plans and deactivate users
  async deactivateExpiredPlans(): Promise<void> {
    const now = new Date();
    const adminRole = this.configService.get('appRoles').ADMIN;
    const expiredAdminIds =
    await this.subscriptionService.getExpiredSubscriptions();
    if (!Array.isArray(expiredAdminIds) || expiredAdminIds.length == 0) return;
    try {
      const result = await this.userModel.updateMany(
        {
          _id: { $in: expiredAdminIds },
          isActive: true,
          role: new Types.ObjectId(`${adminRole}`),
        },
        {
          $set: {
            isActive: false,
            statusChangeNote:
              'Account automatically deactivated due to plan expiration.',
          },
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

  async alertAdminsForExpiry(): Promise<any> {
    const expiredAdminIds =
    await this.subscriptionService.getUpcomingExpiry();
    if (!Array.isArray(expiredAdminIds) || expiredAdminIds.length == 0) return;
    try {
      
      for(let i=0; i<expiredAdminIds.length; i++){
        let admin = await this.userModel.findById(expiredAdminIds[i].admin.toString());
        console.log(admin)
        if(admin){
          await this.notificationService.createNotification({
            recipient: admin._id.toString(),
            title: 'Plan Expiry Alert',
            message: `Your subscription plan is about to expire in 15 days. Please renew your subscription on or before ${new Date(expiredAdminIds[i].expiryDate).toDateString()} to continue using the services.`,
            type: notificationType.WARNING,
            actionType: notificationActionType.EXPIRY_REMINDER,
          })
        }
      }

      this.logger.log(
        `Notification sent to users with upcoming expiry dates.`,
      );

    } catch (error) {
      this.logger.error('Error during plan deactivation:', error.message);
    }


  }

  async incrementCount(
    id: string,
    incrementValue: number = 1,
    session?: ClientSession,
  ): Promise<boolean> {
    const user = await this.userModel.findById(id).session(session).exec();
    if (user) {
      user.dailyContactCount = (user.dailyContactCount || 0) + incrementValue;
      await user.save({ session });
      return true;
    }
    return false;
  }

  async resetDailyContactCount() {
    return await this.userModel.updateMany(
      {
        dailyContactCount: { $gt: 0 },
      },
      { $set: { dailyContactCount: 0 } },
    );
  }

  async getSuperAdminDetails() {
    const role = this.configService.get('appRoles').SUPER_ADMIN;
    const superAdmin = await this.userModel
      .findOne({ role: new Types.ObjectId(`${role}`) })
      .select('companyName email')
      .exec();
    return superAdmin;
  }

  async getClientsForDropdown() {
    const clients = await this.userModel.find({
      role: new Types.ObjectId(`${this.configService.get('appRoles').ADMIN}`),
    });

    if (Array.isArray(clients)) {
      return clients.map((client) => ({
        label: client.email,
        value: client._id,
      }));
    }
    return [];
  }
}
