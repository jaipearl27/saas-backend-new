import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BillingHistory } from '../schemas/BillingHistory.schema';
import { BillingType, DurationType } from '../schemas/BillingHistory.schema';

@Injectable()
export class RevenueService {
  constructor(
    @InjectModel(BillingHistory.name)
    private billingHistoryModel: Model<BillingHistory>,
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
    console.log(startDate, endDate);
    return { startDate, endDate };
  }

  // 1. Total Revenue

  async getTotalRevenue(
    start: Date,
    end: Date,
  ): Promise<{
    gross: number;
    net: number;
    final: number;
    totalDiscounts: number;
    totalTaxes: number;
    count: number;
  }> {
    const result = await this.billingHistoryModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { 
                $gte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
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
                      year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  end
                ]
              }
            ]
          }
        },
      },
      {
        $group: {
          _id: null,
          gross: { $sum: '$itemAmount' },
          net: { $sum: { $subtract: ['$itemAmount', '$discountAmount'] } },
          final: { $sum: '$amount' },
          totalDiscounts: { $sum: '$discountAmount' },
          totalTaxes: { $sum: '$taxAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return result[0]
      ? {
          gross: result[0].gross || 0,
          net: result[0].net || 0,
          final: result[0].final || 0,
          totalDiscounts: result[0].totalDiscounts || 0,
          totalTaxes: result[0].totalTaxes || 0,
          count: result[0].count || 0,
        }
      : {
          gross: 0,
          net: 0,
          final: 0,
          totalDiscounts: 0,
          totalTaxes: 0,
          count: 0,
        };
  }

  // 2. Revenue by Type
  async getRevenueByType(start: Date, end: Date) {
    return this.billingHistoryModel.aggregate([
      {
        $match: {
            $expr: {
              $and: [
                { 
                  $gte: [
                    {
                      $dateFromParts: {
                        year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                        month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                        day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
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
                        year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                        month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                        day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
                        timezone: "Asia/Kolkata"
                      }
                    },
                    end
                  ]
                }
              ]
            }
          },
      },
      {

        $group: {
          _id: '$billingType',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          type: '$_id',
          total: 1,
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { total: 1 },
      },
    ]);
  }

  // 5. Duration-based Revenue
  async getDurationRevenue(start: Date, end: Date) {
    return this.billingHistoryModel.aggregate([
      {
        $match: {
            $expr: {
                $and: [
                  { 
                    $gte: [
                      {
                        $dateFromParts: {
                          year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                          month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                          day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
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
                          year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                          month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                          day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
                          timezone: "Asia/Kolkata"
                        }
                      },
                      end
                    ]
                  }
                ]
              },
          durationType: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$durationType',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          duration: '$_id',
          total: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);
  }

  // 6. Monthly Recurring Revenue (MRR) ??
  async getMRR(start: Date, end: Date): Promise<number> {
    if (!start || !end) throw new BadRequestException('Invalid date range');
    const multiplierMap = {
      [DurationType.ONE_MONTH]: 1,
      [DurationType.QUARTER]: 3,
      [DurationType.HALF_YEAR]: 6,
      [DurationType.ONE_YEAR]: 12,
    };

    const result = await this.billingHistoryModel.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          billingType: { $in: [BillingType.NEW_PLAN, BillingType.RENEWAL] },
          durationType: { $exists: true, $ne: null },
        },
      },
      {
        $addFields: {
          multiplier: {
            $switch: {
              branches: Object.entries(multiplierMap).map(([key, value]) => ({
                case: { $eq: ['$durationType', key] },
                then: value,
              })),
              default: 1,
            },
          },
        },
      },
      {
        $addFields: {
          monthlyContribution: { $divide: ['$amount', '$multiplier'] },
        },
      },
      {
        $group: {
          _id: null,
          mrr: { $sum: '$monthlyContribution' },
        },
      },
    ]);

    return result[0]?.mrr || 0;
  }

  // 7. Tax Collected ??
  async getTaxCollected(
    start: Date,
    end: Date,
  ): Promise<{
    totalTax: number;
    totalRevenue: number;
  }> {
    const result = await this.billingHistoryModel.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalTax: { $sum: '$taxAmount' },
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);
    return result[0] || { totalTax: 0, totalRevenue: 0 };
  }

  // 8. Discounts Given
  async getDiscountsGiven(start: Date, end: Date) {
    const result = await this.billingHistoryModel.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalDiscounts: { $sum: '$discountAmount' },
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);
    return result[0] || { totalDiscounts: 0, totalRevenue: 0 };
  }

  // 9. Revenue Trend ??
  async getRevenueTrend(
    start: Date,
    end: Date,
    interval: 'day' | 'month' = 'day',

  ) {
    const format = interval === 'month' ? '%Y-%m' : '%Y-%m-%d';
    return this.billingHistoryModel.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format, date: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          total: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);
  }

  // 10. Average Revenue Per Admin
  async getARPU(start: Date, end: Date) {
    const [revenueResult, userCount] = await Promise.all([
      this.getTotalRevenue(start, end),
      this.billingHistoryModel
        .distinct('admin', {
          date: { $gte: start, $lte: end },
        })
        .exec(),
    ]);

    return {
      arpu: userCount.length > 0 ? revenueResult.final / userCount.length : 0,
      totalAdmins: userCount.length,
    };
  }

  // 11. Renewal Rate
  async getRenewalMetrics(start: Date, end: Date) {
    const result = await this.billingHistoryModel.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          billingType: { $in: [BillingType.NEW_PLAN, BillingType.RENEWAL] },
        },
      },
      {
        $group: {
          _id: '$billingType',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const metrics = {
      newRevenue: 0,
      renewalRevenue: 0,
      totalRevenue: 0,
      renewalRate: 0,
      newCount: 0,
      renewalCount: 0,
    };

    result.forEach((item) => {
      if (item._id === BillingType.NEW_PLAN) {
        metrics.newRevenue = item.totalRevenue;
        metrics.newCount = item.count;
      } else if (item._id === BillingType.RENEWAL) {
        metrics.renewalRevenue = item.totalRevenue;
        metrics.renewalCount = item.count;
      }
    });

    metrics.totalRevenue = metrics.newRevenue + metrics.renewalRevenue;
    metrics.renewalRate =
      metrics.totalRevenue > 0
        ? (metrics.renewalRevenue / metrics.totalRevenue) * 100
        : 0;

    return metrics;
  }

  // 12. Top Performing Plans
  async getTopPlans(start: Date, end: Date, limit = 5) {
    return this.billingHistoryModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { 
                $gte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
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
                      year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  end
                ]
              }
            ]
          },
          plan: { $exists: true },
        },
      },

      {
        $group: {
          _id: '$plan',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          planName: '$planDetails.name',
          totalRevenue: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);
  }

  // 13. Top Add-ons
  async getTopAddOns(start: Date, end: Date, limit = 5) {
    return this.billingHistoryModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { 
                $gte: [
                  {
                    $dateFromParts: {
                      year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
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
                      year: { $year: { date: "$date", timezone: "Asia/Kolkata" } },
                      month: { $month: { date: "$date", timezone: "Asia/Kolkata" } },
                      day: { $dayOfMonth: { date: "$date", timezone: "Asia/Kolkata" } },
                      timezone: "Asia/Kolkata"
                    }
                  },
                  end
                ]
              }
            ]
          },
          addOn: { $exists: true },
        },

      },

      {
        $group: {
          _id: '$addOn',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'addons',
          localField: '_id',
          foreignField: '_id',
          as: 'addOnDetails'
        }
      },
      { $unwind: '$addOnDetails' },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },

      {
        $project: {
          addOnId: '$addOnDetails._id',
          addOnName: '$addOnDetails.addonName',
          totalRevenue: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);
  }
}
