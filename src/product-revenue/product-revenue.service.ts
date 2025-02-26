import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment } from '../schemas/Enrollments.schema';
import { Products } from '../schemas/Products.schema';

@Injectable()
export class ProductRevenueService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    // @InjectModel(Products.name) private productModel: Model<Products>,
  ) {}

  validateDate(start: string, end: string): { startDate: Date; endDate: Date } {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'Start date cannot be greater than end date',
      );
    }
    return { startDate, endDate };
  }

  async getTotalRevenue(adminId: string, start: Date, end: Date) {
    const result = await this.enrollmentModel.aggregate([
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
          $expr: {
            $and: [
              { 
                $gte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  start
                ]
              },
              { 
                $lte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  end
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);
    
    return result[0]?.totalRevenue || 0;
  }

  async getRevenueByLevel(adminId: string, start: Date, end: Date) {
    return this.enrollmentModel.aggregate([
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
          $expr: {
            $and: [
              { 
                $gte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  start
                ]
              },
              { 
                $lte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  end
                ]
              }
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      { $unwind: '$productData' },
      {
        $group: {
          _id: '$productData.level',
          totalRevenue: { $sum: '$price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
  }

  async getAdoptionRate(adminId: string, start: Date, end: Date) {
    const [baseCustomers, upgradedCustomers] = await Promise.all([
      this.enrollmentModel.aggregate([
        {
          $match: {
            adminId: new Types.ObjectId(adminId),
            $expr: {
              $and: [
                { 
                  $gte: [
                    {
                      $dateFromParts: {
                        year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                        month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                        day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                        timezone: "Asia/Kolkata"
                      }
                    },
                    start
                  ]
                },
                { 
                  $lte: [
                    {
                      $dateFromParts: {
                        year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                        month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                        day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                        timezone: "Asia/Kolkata"
                      }
                    },
                    end
                  ]
                }
              ]
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productData'
          }
        },
        { $unwind: '$productData' },
        { $match: { 'productData.level': 0 } },
        { $group: { _id: '$attendee' } }
      ]),
      
      this.enrollmentModel.aggregate([
        {
          $match: { adminId: new Types.ObjectId(`${adminId}`) }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productData'
          }
        },
        { $unwind: '$productData' },
        {
          $group: {
            _id: '$attendee',
            maxLevel: { $max: '$productData.level' }
          }
        },
        {
          $match: {
            maxLevel: { $gt: 0 }
          }
        }
      ])
    ]);

    const totalBase = baseCustomers.length;
    const totalUpgraded = upgradedCustomers.length;
    
    return {
      totalBaseCustomers: totalBase,
      totalUpgradedCustomers: totalUpgraded,
      adoptionRate: totalBase > 0 ? (totalUpgraded / totalBase) * 100 : 0
    };
  }

  async getTopProducts(adminId: string, start: Date, end: Date, limit = 5){
    return this.enrollmentModel.aggregate([
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
          $expr: {
            $and: [
              { 
                $gte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  start
                ]
              },
              { 
                $lte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  end
                ]
              }
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      { $unwind: '$productData' },
      {
        $group: {
          _id: '$product',
          name: { $first: '$productData.name' },
          totalRevenue: { $sum: '$price' },
          totalSales: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);
  }

  async getRevenueByWebinar(adminId: string, limit:number = 5) {
    return this.enrollmentModel.aggregate([
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
          }
      },
      {
        $group: {
          _id: '$webinar',
          totalRevenue: { $sum: '$price' },
          totalEnrollments: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from : 'webinars',
          localField: '_id',
          foreignField: '_id',
          as: 'webinarDetails'
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit},
      { $project: {
        _id: 1,
        totalRevenue: 1,
        totalEnrollments: 1,
        webinarName: { $arrayElemAt: ['$webinarDetails.webinarName', 0] }
      }}
    ]);
  }

  async getMonthlyRevenue(adminId: string, start: Date, end: Date) {
    return this.enrollmentModel.aggregate([
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
          $expr: {
            $and: [
              { 
                $gte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  start
                ]
              },
              { 
                $lte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  end
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } } ,
            month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } }
          },
          totalRevenue: { $sum: '$price' },
          totalEnrollments: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
  }

  async getTopUsers(adminId: string, start: Date, end: Date, limit = 5) {
    return this.enrollmentModel.aggregate([
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
          $expr: {
            $and: [
              { 
                $gte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  start
                ]
              },
              { 
                $lte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  end
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$attendee",
          totalRevenue: { $sum: "$price" },
          totalPurchases: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);
  }

  async getEnrollmentsByProductLevel(adminId: string, level: number){
    return this.enrollmentModel.aggregate([
      {
        $match: {
          adminId: new Types.ObjectId(adminId),
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      { $unwind: '$productData' },
      {
        $match: {
          'productData.level': level
        }
      },
      {
        $project: {
          _id: 1,
          attendee: 1,
          price: 1,
          createdAt: 1,
          product: 1,
          webinar: 1,
          productData: 1
        }
      }
    ]);
  }
}
