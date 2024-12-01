import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Worker } from 'worker_threads';
import * as path from 'path';
import { User } from '../schemas/User.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExportExcelService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService
) {}

async generateExcel(limit: number, columns: string[]): Promise<string> {
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
    { header: 'Employee Reminder Count', key: 'employeeReminderCount', width: 15 },
    { header: 'Contacts Count', key: 'contactsCount', width: 15 },
  ];

  const selectedColumns = columns.length
    ? defaultColumns.filter((col) => columns.includes(col.key))
    : defaultColumns;

  const pipeline: any[] = [
    { $match: { role: new Types.ObjectId(`${this.configService.get('appRoles').ADMIN}`) } },
    { $limit: limit },
  ];

  if (selectedColumns.some((col) => ['planName', 'planStartDate', 'planExpiry'].includes(col.key))) {
    // console.log('planName, planStartDate, planExpiry');
    pipeline.push(
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'admin',
          as: 'subscription',
        },
      },
      { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'plans',
          localField: 'plan',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } }
    );
  }

  if (selectedColumns.some((col) => ['totalEmployees', 'employeeSalesCount', 'employeeReminderCount'].includes(col.key))) {
    // console.log('totalEmployees, employeeSalesCount, employeeReminderCount');
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'adminId',
        as: 'employees',
      },
    });
  }

  if (selectedColumns.some((col) => col.key === 'contactsCount')) {
    // console.log('contactsCount');
    pipeline.push({
      $lookup: {
        from: 'attendees',
        let: { adminId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$adminId', '$$adminId'] } } },
          { $count: 'totalCount' },
        ],
        as: 'contactsCount',
      },
    });
    pipeline.push({
      $unwind: { path: '$contactsCount', preserveNullAndEmptyArrays: true },
    });
  }

  pipeline.push({
    $addFields: {
      ...(selectedColumns.some((col) => col.key === 'planName') ? { planName: '$plan.name' } : {}),
      ...(selectedColumns.some((col) => col.key === 'planStartDate') ? { planStartDate: '$subscription.startDate' } : {}),
      ...(selectedColumns.some((col) => col.key === 'planExpiry') ? { planExpiry: '$subscription.expiryDate' } : {}),
      ...(selectedColumns.some((col) => col.key === 'contactsLimit') ? { contactsLimit: '$subscription.contactLimit' } : {}),
      ...(selectedColumns.some((col) => col.key === 'totalEmployees') ? { totalEmployees: { $size: '$employees' } } : {}),
      ...(selectedColumns.some((col) => col.key === 'employeeSalesCount')
        ? {
            employeeSalesCount: {
              $size: {
                $filter: {
                  input: '$employees',
                  as: 'emp',
                  cond: { $eq: ['$$emp.role', new Types.ObjectId('66b758544892ce3d994745cb')] },
                },
              },
            },
          }
        : {}),
      ...(selectedColumns.some((col) => col.key === 'employeeReminderCount')
        ? {
            employeeReminderCount: {
              $size: {
                $filter: {
                  input: '$employees',
                  as: 'emp',
                  cond: { $eq: ['$$emp.role', new Types.ObjectId('66b7585d4892ce3d994745ce')] },
                },
              },
            },
          }
        : {}),
      ...(selectedColumns.some((col) => col.key === 'contactsCount')
        ? { contactsCount: { $ifNull: ['$contactsCount.totalCount', 0] } }
        : {}),
    },
  });

  pipeline.push({
    $project: selectedColumns.reduce((proj, col) => ({ ...proj, [col.key]: 1 }), {}),
  });
  // console.log(pipeline);

  const cursor = this.userModel.aggregate(pipeline).cursor();
// console.log("cursor",cursor)
  for await (const doc of cursor) {
    data.push(doc);
  }

  // Generate Excel using the worker thread
  const workerPath = path.resolve(__dirname, '../workers/generate-excel.worker.js');

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, { workerData: { data, columns: selectedColumns } });

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
