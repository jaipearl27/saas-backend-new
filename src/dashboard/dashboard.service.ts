import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BillingHistory } from 'src/schemas/BillingHistory.schema';
import { Plans } from 'src/schemas/Plans.schema';
import { Subscription } from 'src/schemas/Subscription.schema';
import { User } from 'src/schemas/User.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Subscription.name)
    private subscriptionsModel: Model<Subscription>,
    @InjectModel(BillingHistory.name)
    private billingHistoryModel: Model<BillingHistory>,
    private usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async superAdminDashboard(startDate: string, endDate: string): Promise<any> {
    const pipeline = [
      {
        // Match users within the specified date range
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        // Add fields to differentiate roles
        $addFields: {
          isAdmin: {
            $eq: [
              '$role',
              new Types.ObjectId(`${this.configService.get('appRoles').ADMIN}`),
            ],
          }, // Mark as admin if role is 1
          isEmployee: {
            $in: [
              '$role',
              [
                new Types.ObjectId(
                  `${this.configService.get('appRoles').EMPLOYEE_SALES}`,
                ),
                new Types.ObjectId(
                  `${this.configService.get('appRoles').EMPLOYEE_REMINDER}`,
                ),
              ],
            ],
          }, // Mark as employee if role is 3 or 4
        },
      },

      {
        // Lookup to join billingHistory by adminId
        $lookup: {
          from: 'billinghistories', // Billing history collection
          localField: '_id', // User's ID (for admins, it acts as adminId)
          foreignField: 'admin', // admin field in billingHistory
          as: 'billingHistory',
        },
      },
      {
        // Unwind the billingHistory array for processing revenue
        $unwind: {
          path: '$billingHistory',
          preserveNullAndEmptyArrays: true, // Keep users even if no billing history is present
        },
      },
      {
        // Match billingHistory within the same date range (optional but recommended for accurate filtering)
        $match: {
          $or: [
            {
              'billingHistory.date': {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { billingHistory: null }, // Keep users without billing history
          ],
        },
      },

      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'admin',
          as: 'subscriptions',
        },
      },
      {
        $unwind: {
          path: '$subscriptions',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            {
              'subscriptions.updatedAt': {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { subscriptions: null },
          ],
        },
      },

      {
        $lookup: {
          from: 'attendees',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$admin', '$$userId'] },
                    {
                      $gte: ['$createdAt', new Date(startDate)],
                    },
                    {
                      $lte: ['$createdAt', new Date(endDate)],
                    },
                  ],
                },
              },
            },
          ],
          as: 'attendees',
        },
      },

      // Add the contactsUsed field by counting the number of attendees
      {
        $addFields: {
          contactsUsed: { $size: '$attendees' }, // Count the number of attendees
        },
      },

      {
        // Group back to consolidate billingHistory and calculate total revenue
        $group: {
          _id: '$_id',
          totalAdmins: { $sum: { $cond: [{ $eq: ['$isAdmin', true] }, 1, 0] } }, // Count Admins
          totalEmployees: {
            $sum: { $cond: [{ $eq: ['$isEmployee', true] }, 1, 0] },
          }, // Count Employees
          accountsCreated: { $first: '$createdAt' }, // Keep createdAt for account calculation
          activeAccounts: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          }, // Active accounts
          revenue: { $sum: '$billingHistory.amount' }, // Sum up revenue from billing history
          contactsLimit: { $sum: '$subscriptions.contactLimit' },
          contactsUsed: { $sum: '$contactsUsed' }, // Sum up contactsUsed for each user
        },
      },
      {
        // Final grouping to consolidate dashboard metrics
        $group: {
          _id: null,
          totalAdmins: { $sum: '$totalAdmins' }, // Total Admins
          totalEmployees: { $sum: '$totalEmployees' }, // Total Employees
          accountsCreated: { $sum: 1 }, // Total accounts created in date range
          activeAccounts: { $sum: '$activeAccounts' }, // Total active accounts
          totalRevenue: { $sum: '$revenue' }, // Total revenue from billing history
          totalContactsLimit: { $sum: '$contactsLimit' },
          totalContactsUsed: { $sum: '$contactsUsed' },
        },
      },

      {
        // Format the output
        $project: {
          _id: 0,
          totalAdmins: 1,
          totalEmployees: 1,
          accountsCreated: 1,
          activeAccounts: 1,
          totalRevenue: 1,
          totalContactsLimit: 1,
          totalContactsUsed: 1,
        },
      },
    ];

    const result = await this.userModel.aggregate(pipeline);
    return result;
  }

  async plansMetric(startDate: string, endDate: string): Promise<any> {
    const pipeline = [
      {
        $match: {
          updatedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
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
        $group: {
          _id: { $arrayElemAt: ['$plan', 0] },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default _id field
          plan: '$_id', // Rename _id to plan
          total: 1, // Include the total field
        },
      },
    ];

    const result = await this.subscriptionsModel.aggregate(pipeline);
    return result;
  }

  async userRegisterationMetrics(
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const pipeline = [
      {
        $match: {
          updatedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }, // Extract date only
          },
          total: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
        },
      },
    ];

    const result = await this.userModel.aggregate(pipeline);
    return result;
  }

  async revenueMetrics(startDate: string, endDate: string): Promise<any> {
    const pipeline = [
      {
        $match: {
          updatedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }, // Extract date only
          },
          totalRevenue: {
            $sum: '$amount',
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalRevenue: 1,
        },
      },
    ];

    const result = await this.billingHistoryModel.aggregate(pipeline);
    return result;
  }
}
