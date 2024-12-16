import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Worker } from 'worker_threads';
import * as path from 'path';
import { User } from '../schemas/User.schema';
import { GetClientsFilterDto } from 'src/users/dto/filters.dto';
import { UsersService } from 'src/users/users.service';
import { AttendeesFilterDto } from 'src/attendees/dto/attendees.dto';
import { AttendeesService } from 'src/attendees/attendees.service';
import { WebinarFilterDTO } from 'src/webinar/dto/webinar-filter.dto';
import { WebinarService } from 'src/webinar/webinar.service';

@Injectable()
export class ExportExcelService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly usersService: UsersService,
    private readonly attendeeService: AttendeesService,
    private readonly webinarService: WebinarService
  ) {}

  async generateExcel(
    workerData: any,
    workerPath: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, { workerData });
  
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
  
  async generateExcelForClients(
    limit: number,
    columns: string[],
    filterData: GetClientsFilterDto,
  ): Promise<string> {
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
      { header: 'Toggle Limit', key: 'toggleLimit', width: 15 },
    ];
  
    const selectedColumns = columns.length
      ? defaultColumns.filter((col) => columns.includes(col.key))
      : defaultColumns;
  
    const pipeline = this.usersService.createClientPipeline(filterData);
    const cursor = this.userModel
      .aggregate([...pipeline, { $limit: limit }])
      .cursor();
  
    for await (const doc of cursor) {
      data.push(doc);
    }
  
    const workerPath = path.resolve(__dirname, '../workers/generate-excel.worker.js');
    return this.generateExcel({ data, columns: selectedColumns }, workerPath);
  }
  
  async generateExcelForWebinarAttendees(
    limit: number,
    columns: string[],
    filterData: AttendeesFilterDto,
    webinarId: string,
    isAttended: boolean,
    adminId: string,
  ): Promise<string> {
    const aggregationResult = await this.attendeeService.getAttendees(
      webinarId,
      adminId,
      isAttended,
      1,
      limit,
      filterData,
    );
  
    const payload = {
      data: aggregationResult.result || [],
      columns: columns.map((col) => ({
        header: col,
        key: col,
        width: 20,
      })),
    };
  
    const workerPath = path.resolve(__dirname, '../workers/generate-excel.worker.js');
    return this.generateExcel(payload, workerPath);
  }

  async generateExcelForWebinar(
    limit: number,
    columns: string[],
    filterData: WebinarFilterDTO,
    adminId: string,
  ): Promise<string> {
    const aggregationResult = await this.webinarService.getWebinars(adminId,1, limit,filterData,false)
  
    const payload = {
      data: aggregationResult.result || [],
      columns: columns.map((col) => ({
        header: col,
        key: col,
        width: 20,
      })),
    };
  
    const workerPath = path.resolve(__dirname, '../workers/generate-excel.worker.js');
    return this.generateExcel(payload, workerPath);
  }
  

  // async generateExcelForClientsOld(limit: number, columns: string[], filterData: GetClientsFilterDto): Promise<string> {
  //   const data = [];

  //   const defaultColumns = [
  //     { header: 'Email', key: 'email', width: 50 },
  //     { header: 'Company Name', key: 'companyName', width: 30 },
  //     { header: 'User Name', key: 'userName', width: 20 },
  //     { header: 'Phone', key: 'phone', width: 15 },
  //     { header: 'Is Active', key: 'isActive', width: 10 },
  //     { header: 'Plan Name', key: 'planName', width: 20 },
  //     { header: 'Plan Start Date', key: 'planStartDate', width: 20 },
  //     { header: 'Plan Expiry', key: 'planExpiry', width: 20 },
  //     { header: 'Contacts Limit', key: 'contactsLimit', width: 15 },
  //     { header: 'Total Employees', key: 'totalEmployees', width: 15 },
  //     { header: 'Employee Sales Count', key: 'employeeSalesCount', width: 15 },
  //     {
  //       header: 'Employee Reminder Count',
  //       key: 'employeeReminderCount',
  //       width: 15,
  //     },
  //     { header: 'Contacts Count', key: 'contactsCount', width: 15 },
  //     { header: "Toggle Limit", key: "toggleLimit", width: 15 },
  //   ];

  //   const selectedColumns = columns.length
  //     ? defaultColumns.filter((col) => columns.includes(col.key))
  //     : defaultColumns;

  //   // Convert selectedColumns into a Set for faster lookups
  //   const columnKeysSet = new Set(selectedColumns.map((col) => col.key));

  //   const matchFilters = {};
  //   if (filterData.email) {
  //     matchFilters['email'] = filterData.email;
  //   }
  //   if (filterData.companyName) {
  //     matchFilters['companyName'] = filterData.companyName;
  //   }
  //   if (filterData.userName) {
  //     matchFilters['userName'] = filterData.userName;
  //   }
  //   if (filterData.phone) {
  //     matchFilters['phone'] = filterData.phone;
  //   }
  //   if (filterData.isActive) {
  //     matchFilters['isActive'] = filterData.isActive;
  //   }

  //   const pipeline: any[] = [
  //     {
  //       $match: {
  //         role: new Types.ObjectId(
  //           `${this.configService.get('appRoles').ADMIN}`,
  //         ),
  //         ...matchFilters,
  //       },
  //     },
  //   ];

  //   if (columnKeysSet.has('planStartDate') || columnKeysSet.has('planExpiry')) {
  //     const subscriptionFilter = {};
  //     if (filterData.planStartDate) {
  //       subscriptionFilter['startDate'] = filterData.planStartDate;
  //     }
  //     if (filterData.planExpiry) {
  //       subscriptionFilter['expiryDate'] = filterData.planExpiry;
  //     }
  //     if (filterData.contactsLimit) {
  //       subscriptionFilter['contactLimit'] = filterData.contactsLimit;
  //     }

  //     pipeline.push(
  //       {
  //         $lookup: {
  //           from: 'subscriptions',
  //           localField: '_id',
  //           foreignField: 'admin',
  //           pipeline: [
  //             {
  //               $match: subscriptionFilter,
  //             },
  //             {
  //               $project: {
  //                 startDate: 1,
  //                 expiryDate: 1,
  //                 contactLimit: 1,
  //               },
  //             },
  //           ],
  //           as: 'subscription',
  //         },
  //       },
  //       {
  //         $unwind: { path: '$subscription', preserveNullAndEmptyArrays: false },
  //       },
  //     );
  //   }

  //   if (columnKeysSet.has('planname')) {
  //     const planFilter = {};
  //     if (filterData.planName) {
  //       planFilter['name'] = filterData.planName;
  //     }

  //     pipeline.push(
  //       {
  //         $lookup: {
  //           from: 'plans',
  //           localField: 'plan',
  //           foreignField: '_id',
  //           pipeline: [
  //             {
  //               $match: planFilter,
  //             },
  //             {
  //               $project: {
  //                 name: 1,
  //               },
  //             },
  //           ],
  //           as: 'plan',
  //         },
  //       },
  //       { $unwind: { path: '$plan', preserveNullAndEmptyArrays: false } },
  //     );
  //   }

  //   if (
  //     ['totalEmployees', 'employeeSalesCount', 'employeeReminderCount'].some(
  //       (key) => columnKeysSet.has(key),
  //     )
  //   ) {
  //     pipeline.push({
  //       $lookup: {
  //         from: 'users',
  //         localField: '_id',
  //         foreignField: 'adminId',
  //         as: 'employees',
  //       },
  //     });
  //   }

  //   pipeline.push({
  //     $addFields: {
  //       planName: '$plan.name',
  //       planStartDate: '$subscription.startDate',
  //       planExpiry: '$subscription.expiryDate',
  //       contactsLimit: '$subscription.contactLimit',
  //       totalEmployees: { $size: '$employees' },
  //       employeeSalesCount: {
  //         $size: {
  //           $filter: {
  //             input: '$employees',
  //             as: 'emp',
  //             cond: {
  //               $eq: [
  //                 '$$emp.role',
  //                 new Types.ObjectId('66b758544892ce3d994745cb'),
  //               ],
  //             },
  //           },
  //         },
  //       },
  //       employeeReminderCount: {
  //         $size: {
  //           $filter: {
  //             input: '$employees',
  //             as: 'emp',
  //             cond: {
  //               $eq: [
  //                 '$$emp.role',
  //                 new Types.ObjectId('66b7585d4892ce3d994745ce'),
  //               ],
  //             },
  //           },
  //         },
  //       },
  //       // ...(columnKeysSet.has('contactsCount')
  //       //   ? { contactsCount: { $ifNull: ['$contactsCount.totalCount', 0] } }
  //       //   : {}),
  //     },
  //   });

  //   const employeeCountFilter = {};
  //   if (filterData.totalEmployees) {
  //     employeeCountFilter['totalEmployees'] = filterData.totalEmployees;
  //   }
  //   if (filterData.employeeSalesCount) {
  //     employeeCountFilter['employeeSalesCount'] = filterData.employeeSalesCount;
  //   }
  //   if (filterData.employeeReminderCount) {
  //     employeeCountFilter['employeeReminderCount'] =
  //       filterData.employeeReminderCount;
  //   }
  //   pipeline.push({
  //     $match: employeeCountFilter,
  //   });

  //   pipeline.push({ $limit: limit });

  //   pipeline.push({
  //     $project: selectedColumns.reduce(
  //       (proj, col) => ({ ...proj, [col.key]: 1 }),
  //       {},
  //     ),
  //   });

  //   const cursor = this.userModel.aggregate(pipeline).cursor();

  //   for await (const doc of cursor) {
  //     data.push(doc);
  //   }

  //   const workerPath = path.resolve(
  //     __dirname,
  //     '../workers/generate-excel.worker.js',
  //   );

  //   return new Promise((resolve, reject) => {
  //     const worker = new Worker(workerPath, {
  //       workerData: { data, columns: selectedColumns },
  //     });

  //     worker.on('message', (message) => {
  //       if (message.success) {
  //         resolve(message.filePath);
  //       } else {
  //         console.error('Worker Error:', message.error);
  //         reject(new Error(message.error));
  //       }
  //     });

  //     worker.on('error', (err) => {
  //       console.error('Worker Thread Error:', err);
  //       reject(err);
  //     });

  //     worker.on('exit', (code) => {
  //       if (code !== 0) {
  //         console.error(`Worker stopped with exit code ${code}`);
  //         reject(new Error(`Worker stopped with exit code ${code}`));
  //       }
  //     });
  //   });
  // }
}
