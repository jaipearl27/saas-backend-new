import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Worker } from 'worker_threads';
import * as path from 'path';
import { User } from '../schemas/User.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExportExcelService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) { }

  async generateExcel(limit: number, columns: string[], filterData: any = {}): Promise<string> {
    const data = [];

    const defaultColumns = [
      { header: 'Email', key: 'email', width: 50 },
      { header: 'Company Name', key: 'companyName', width: 30 },
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Is Active', key: 'isActive', width: 10 },
      { header: 'Plan Name', key: 'planName', width: 20 },
      { header: 'Plan Start Date', key: 'planStartDate', width: 20 },
      { header: 'Plan Expiry', key: 'planExpiry', width: 20 },
      { header: 'Contacts Limit', key: 'contactsLimit', width: 15 },
      { header: 'Total Employees', key: 'totalEmployees', width: 15 },
      { header: 'Employee Sales Count', key: 'employeeSalesCount', width: 15 },
      {
        header: 'Employee Reminder Count',
        key: 'employeeReminderCount',
        width: 15,
      },
      { header: 'Contacts Count', key: 'contactsCount', width: 15 },
    ];

    // const filterData = {
    //   email: 'user@example.com',
    //   companyName: 'Acme Corp',
    //   userName: 'JohnDoe',
    //   phone: '1234567890',
    //   isActive: true,
    //   planName: 'Premium Plan',
    //   planStartDate: {
    //     $gte: new Date('2023-01-01'), // Greater than or equal to January 1st, 2023
    //     $lte: new Date('2023-12-31'), // Less than or equal to December 31st, 2023
    //   },
    //   planExpiry: {
    //     $gte: new Date('2024-01-01'), // Greater than or equal to January 1st, 2024
    //     $lte: new Date('2024-12-31'), // Less than or equal to December 31st, 2024
    //   },
    //   contactsLimit: {
    //     $gte: 100, // Greater than or equal to 100
    //     $lte: 500, // Less than or equal to 500
    //   },
    //   totalEmployees: {
    //     $gte: 50, // Greater than or equal to 50
    //     $lte: 200, // Less than or equal to 200
    //   },
    //   employeeSalesCount: {
    //     $gte: 10, // Greater than or equal to 10
    //     $lte: 50, // Less than or equal to 50
    //   },
    //   employeeReminderCount: {
    //     $gte: 1, // Greater than or equal to 1
    //     $lte: 5, // Less than or equal to 5
    //   },
    //   contactsCount: {
    //     $gte: 200, // Greater than or equal to 200
    //     $lte: 1000, // Less than or equal to 1000
    //   },
    // };

    const selectedColumns = columns.length
      ? defaultColumns.filter((col) => columns.includes(col.key))
      : defaultColumns;

    // Convert selectedColumns into a Set for faster lookups
    const columnKeysSet = new Set(selectedColumns.map((col) => col.key));

    const matchFilters = {};
    if (filterData.email) {
      matchFilters['email'] = filterData.email;
    }
    if (filterData.companyName) {
      matchFilters['companyName'] = filterData.companyName;
    }
    if (filterData.userName) {
      matchFilters['userName'] = filterData.userName;
    }
    if (filterData.phone) {
      matchFilters['phone'] = filterData.phone;
    }
    if (filterData.isActive) {
      matchFilters['isActive'] = filterData.isActive;
    }

    const pipeline: any[] = [
      {
        $match: {
          role: new Types.ObjectId(
            `${this.configService.get('appRoles').ADMIN}`,
          ),
          ...matchFilters,
        },
      },
    ];

    if (columnKeysSet.has('planStartDate') || columnKeysSet.has('planExpiry')) {
      const subscriptionFilter = {};
      if (filterData.planStartDate) {
        subscriptionFilter['startDate'] = filterData.planStartDate;
      }
      if (filterData.planExpiry) {
        subscriptionFilter['expiryDate'] = filterData.planExpiry;
      }
      if (filterData.contactsLimit) {
        subscriptionFilter['contactLimit'] = filterData.contactsLimit;
      }

      pipeline.push(
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
                },
              },
            ],
            as: 'subscription',
          },
        },
        {
          $unwind: { path: '$subscription', preserveNullAndEmptyArrays: false },
        },
      );
    }

    if (columnKeysSet.has('planname')) {
      const planFilter = {};
      if (filterData.planName) {
        planFilter['name'] = filterData.planName;
      }

      pipeline.push(
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
        { $unwind: { path: '$plan', preserveNullAndEmptyArrays: false } },
      );
    }

    if (
      ['totalEmployees', 'employeeSalesCount', 'employeeReminderCount'].some(
        (key) => columnKeysSet.has(key),
      )
    ) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'adminId',
          as: 'employees',
        },
      });
    }

    // if (columnKeysSet.has('contactsCount')) {
    //   pipeline.push({
    //     $lookup: {
    //       from: 'attendees',
    //       let: { adminId: '$_id' },
    //       pipeline: [
    //         { $match: { $expr: { $eq: ['$adminId', '$$adminId'] } } },
    //         { $count: 'totalCount' },
    //       ],
    //       as: 'contactsCount',
    //     },
    //   });
    //   pipeline.push({
    //     $unwind: { path: '$contactsCount', preserveNullAndEmptyArrays: true },
    //   });
    // }

    pipeline.push({
      $addFields: {
        planName: '$plan.name',
        planStartDate: '$subscription.startDate',
        planExpiry: '$subscription.expiryDate',
        contactsLimit: '$subscription.contactLimit',
        totalEmployees: { $size: '$employees' },
        employeeSalesCount: {
          $size: {
            $filter: {
              input: '$employees',
              as: 'emp',
              cond: {
                $eq: [
                  '$$emp.role',
                  new Types.ObjectId('66b758544892ce3d994745cb'),
                ],
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
                $eq: [
                  '$$emp.role',
                  new Types.ObjectId('66b7585d4892ce3d994745ce'),
                ],
              },
            },
          },
        },
        // ...(columnKeysSet.has('contactsCount')
        //   ? { contactsCount: { $ifNull: ['$contactsCount.totalCount', 0] } }
        //   : {}),
      },
    });

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
    pipeline.push({
      $match: employeeCountFilter,
    });

    pipeline.push({ $limit: limit });

    pipeline.push({
      $project: selectedColumns.reduce(
        (proj, col) => ({ ...proj, [col.key]: 1 }),
        {},
      ),
    });

    const cursor = this.userModel.aggregate(pipeline).cursor();

    for await (const doc of cursor) {
      data.push(doc);
    }

    const workerPath = path.resolve(
      __dirname,
      '../workers/generate-excel.worker.js',
    );

    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: { data, columns: selectedColumns },
      });

      worker.on('message', (message) => {
        if (message.success) {
          resolve(message.filePath);
        } else {
          console.error('Worker Error:', message.error);
          reject(new Error(message.error));
        }
      });

      worker.on('error', (err) => {
        console.error('Worker Thread Error:', err);
        reject(err);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker stopped with exit code ${code}`);
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
}
