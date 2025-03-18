import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, PipelineStage, Types } from 'mongoose';
import { Subscription } from 'src/schemas/Subscription.schema';
import { SubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { AddOnService } from 'src/addon/addon.service';
import { BillingHistoryService } from 'src/billing-history/billing-history.service';
import { SubscriptionAddonService } from 'src/subscription-addon/subscription-addon.service';
import { PlansService } from 'src/plans/plans.service';
import { AttendeesService } from 'src/attendees/attendees.service';
import { UsersService } from 'src/users/users.service';
import {
  BillingType,
  DurationType,
  monthMultiplier,
} from 'src/schemas/BillingHistory.schema';
import { PlanDurationConfig } from 'src/schemas/Plans.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private SubscriptionModel: Model<Subscription>,
    @Inject(forwardRef(() => AddOnService))
    private readonly addOnService: AddOnService,
    @Inject(forwardRef(() => SubscriptionAddonService))
    private readonly subscriptionAddonService: SubscriptionAddonService,
    @Inject(forwardRef(() => AttendeesService))
    private readonly attendeesService: AttendeesService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly BillingHistoryService: BillingHistoryService,
    @Inject(forwardRef(() => PlansService))
    private readonly plansService: PlansService,
  ) {}

  async addSubscription(subscriptionDto: SubscriptionDto): Promise<any> {
    const result = await this.SubscriptionModel.create(subscriptionDto);
    return result;
  }

  async updateSubscription(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<any> {
    const result = await this.SubscriptionModel.findByIdAndUpdate(
      id,
      updateSubscriptionDto,
    );
    return result;
  }

  async getSubscription(adminId: string): Promise<Subscription> {
    const result = await this.SubscriptionModel.findOne({
      admin: new Types.ObjectId(`${adminId}`),
    }).populate('plan');
    return result;
  }

  async getUpcomingExpiry(): Promise<Subscription[]> {
    const today = new Date();
    const date15DaysLater = new Date();
    date15DaysLater.setDate(today.getDate() + 15);

    const startOfDay15DaysLater = new Date(
      date15DaysLater.setHours(0, 0, 0, 0),
    );

    const endOfDay15DaysLater = new Date(
      date15DaysLater.setHours(23, 59, 59, 999),
    );

    const result = await this.SubscriptionModel.find({
      expiryDate: { $gte: startOfDay15DaysLater, $lte: endOfDay15DaysLater },
    });

    return result;
  }

  async getExpiredSubscriptions(): Promise<Types.ObjectId[]> {
    const result = await this.SubscriptionModel.find({
      expiryDate: { $lt: new Date() },
    });
    return result.map((subscription) => subscription.admin);
  }

  async addAddonToSubscription(adminId: string, addonId: string) {
    const session = await this.SubscriptionModel.db.startSession();
    session.startTransaction();

    try {
      const addOn = await this.addOnService.getAddOnById(addonId);

      if (!addOn) {
        throw new NotFoundException('Addon not found');
      }

      const subscription = await this.SubscriptionModel.findOne({
        admin: new Types.ObjectId(`${adminId}`),
      }).session(session); // Use session for the query

      if (!subscription) {
        throw new NotFoundException(
          `Subscription with admin ID ${adminId} not found`,
        );
      }

      if (new Date() > subscription.expiryDate) {
        throw new NotFoundException('Subscription Expired');
      }

      const currentDate = new Date();
      const addOnExpiryFromValidity = new Date(
        currentDate.getTime() + addOn.validityInDays * 24 * 60 * 60 * 1000,
      );

      const addOnExpiry = subscription.expiryDate
        ? new Date(
            Math.min(
              addOnExpiryFromValidity.getTime(),
              subscription.expiryDate.getTime(),
            ),
          )
        : addOnExpiryFromValidity;

      const subscriptionAddon = await this.subscriptionAddonService
        .createSubscriptionAddon(
          subscription._id as string,
          addOnExpiry,
          addOn._id as string,
          addOn.employeeLimit,
          addOn.contactLimit,
        )
        .catch(() => {
          throw new Error('Failed to create subscription addon');
        });

      subscription.employeeLimitAddon = Math.max(
        (subscription.employeeLimitAddon || 0) + addOn.employeeLimit,
        0,
      );

      subscription.contactLimitAddon = Math.max(
        (subscription.contactLimitAddon || 0) + addOn.contactLimit,
        0,
      );

      await subscription.save();
      await session.commitTransaction();
      session.endSession();
      const { itemAmount, taxAmount, totalAmount } = this.generatePriceForAddon(
        addOn.addOnPrice,
      );

      const billing = await this.BillingHistoryService.addOneBillingHistory(
        adminId,
        addonId,
        itemAmount,
        taxAmount,
        totalAmount,
        18,
      ).catch(() => {
        throw new Error('Failed to create billing history');
      });

      return {
        subscription,
        billing,
        subscriptionAddon,
      };
    } catch (error) {
      // Rollback the transaction in case of an error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  generatePriceForAddon(amount: number) {
    const taxAmount = amount * 0.18;
    const totalAmount = amount + taxAmount;
    return {
      itemAmount: amount,
      taxAmount,
      totalAmount,
    };
  }

  async decrementSubscriptionAddons(
    employeeLimit: number,
    contactLimit: number,
    subscriptionId: Types.ObjectId,
    session: ClientSession,
  ): Promise<Subscription | null> {
    const result = await this.SubscriptionModel.findById(subscriptionId);
    if (!result) {
      return null;
    }

    // Ensure values do not go below 0
    result.employeeLimitAddon = Math.max(
      (result.employeeLimitAddon || 0) - employeeLimit,
      0,
    );
    result.contactLimitAddon = Math.max(
      (result.contactLimitAddon || 0) - contactLimit,
      0,
    );
    await result.save({ session });
    return result;
  }

  async updateClientPlan(
    adminId: string,
    planId: string,
    durationType: DurationType,
  ) {
    const subscription = await this.SubscriptionModel.findOne({
      admin: new Types.ObjectId(`${adminId}`),
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with admin ID ${adminId} not found`,
      );
    }

    const isPlanExpired = new Date() > new Date(subscription.expiryDate);

    const usedContacts = await this.attendeesService.getDynamicAttendeeCount(
      new Types.ObjectId(`${adminId}`),
    );
    const usedEmployees = await this.userService.getEmployeesCount(adminId);

    const plan = await this.plansService.getPlan(planId);

    // if (plan.renewalNotAllowed) {
    //   throw new BadRequestException('Renewal not allowed');
    // }

    const isDurationConfig = plan.planDurationConfig.has(durationType);
    if (!isDurationConfig) {
      throw new NotFoundException('Duration type not found');
    }

    if (usedContacts > plan.contactLimit) {
      throw new BadRequestException('You cannot downgrade the plan');
    }

    if (usedEmployees > plan.employeeCount) {
      throw new BadRequestException('You cannot downgrade the plan');
    }

    const durationConfig = plan.planDurationConfig.get(durationType);

    if (String(subscription.plan) === String(planId) && !isPlanExpired) {
      subscription.expiryDate = new Date(
        subscription.expiryDate.getTime() +
          durationConfig.duration * 24 * 60 * 60 * 1000,
      );
    } else {
      subscription.startDate = new Date();
      subscription.expiryDate = new Date(
        Date.now() + durationConfig.duration * 24 * 60 * 60 * 1000,
      );
    }

    subscription.plan = new Types.ObjectId(`${planId}`);
    subscription.contactLimit = plan.contactLimit;
    subscription.employeeLimit = plan.employeeCount;
    subscription.toggleLimit = plan.toggleLimit;

    const { totalWithGST, itemAmount, discountAmount, gst } =
      await this.generatePriceForPlan(
        plan.amount,
        durationType,
        durationConfig,
      );

    const billing = await this.BillingHistoryService.addBillingHistory(
      {
        admin: adminId,
        plan: planId,
        amount: totalWithGST,
        itemAmount: itemAmount,
        discountAmount: discountAmount,
        taxPercent: 18,
        taxAmount: gst,
        durationType: durationType,
      },
      BillingType.RENEWAL,
    );

    if (isPlanExpired)
      await this.userService.updateClient(adminId, { isActive: true });

    await subscription.save();

    const user = await this.userService.getUserById(adminId);
    if (user) {
      user.isActive = true;
      await user.save();
    }

    return { subscription, billing };
  }

  async incrementContactCount(id: string, count: number = 1) {
    const subscription = await this.SubscriptionModel.findById(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    subscription.contactCount = subscription.contactCount + count;
    await subscription.save();
    return subscription;
  }

  async updateContactCount(
    adminId: Types.ObjectId,
    count: number,
    session: ClientSession,
  ) {
    return this.SubscriptionModel.updateOne(
      { admin: adminId },
      { $set: { contactCount: count } },
      { session },
    );
  }

  async generatePriceForPlan(
    amount: number,
    durationType: DurationType,
    durationConfig: PlanDurationConfig,
  ): Promise<{
    totalWithGST: number;
    itemAmount: number;
    discountAmount: number;
    gst: number;
  }> {
    let itemAmount = 0;
    if (durationType === 'custom') itemAmount = amount;
    else itemAmount = amount * monthMultiplier[durationType];
    const discountAmount =
      durationConfig.discountType === 'flat'
        ? durationConfig.discountValue
        : (itemAmount * durationConfig.discountValue) / 100;

    const subTotal = itemAmount - discountAmount;
    const gst = subTotal * 0.18; // 18% GST
    const totalWithGST = subTotal + gst;

    return {
      itemAmount,
      discountAmount,
      gst,
      totalWithGST: totalWithGST,
    };
  }

  async getPlanSubscriptionCount(): Promise<
    { _id: string; subscriptionCount: number }[]
  > {
    const pipeline: PipelineStage[] = [
      {
        $group: {
          _id: '$plan',
          subscriptionCount: {
            $sum: 1,
          },
        },
      },
    ];
    const result = await this.SubscriptionModel.aggregate(pipeline).exec();
    return result;
  }

  async updateSubscriptionAddons() {
    // read it before making any changes
    // it is used to update the subscription document with the addons Limits when the addon is expired
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'subscriptionaddons',
          localField: '_id',
          foreignField: 'subscription',
          as: 'addonDetails',
        },
      },
      {
        $match: {
          $or: [
            { addonDetails: { $ne: [] } },
            { employeeLimitAddon: { $gt: 0 } },
            { contactLimitAddon: { $gt: 0 } },
          ],
        },
      },
      {
        $addFields: {
          totalEmployeeLimitAddon: {
            $sum: {
              $map: {
                input: '$addonDetails',
                as: 'addon',
                in: { $ifNull: ['$$addon.employeeLimit', 0] },
              },
            },
          },
          totalContactLimitAddon: {
            $sum: {
              $map: {
                input: '$addonDetails',
                as: 'addon',
                in: { $ifNull: ['$$addon.contactLimit', 0] },
              },
            },
          },
        },
      },
      {
        $project: {
          addonDetails: 0,
        },
      },
      {
        $match: {
          $or: [
            {
              $expr: {
                $ne: ['$employeeLimitAddon', '$totalEmployeeLimitAddon'],
              },
            },
            {
              $expr: { $ne: ['$contactLimitAddon', '$totalContactLimitAddon'] },
            },
          ],
        },
      },
      {
        $set: {
          employeeLimitAddon: { $ifNull: ['$totalEmployeeLimitAddon', 0] },
          contactLimitAddon: { $ifNull: ['$totalContactLimitAddon', 0] },
        },
      },

      {
        $unset: ['totalEmployeeLimitAddon', 'totalContactLimitAddon'],
      },
      {
        $merge: {
          into: 'subscriptions',
          on: '_id',
          whenMatched: 'merge',
          whenNotMatched: 'discard',
        },
      },
    ];
    const result = await this.SubscriptionModel.aggregate(pipeline).exec();
    console.log('result -------- >', result);
    return result;
  }

  async updateSingleSubscriptionAddon(subscriptionId: string) {
    const subscription = await this.SubscriptionModel.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: new Types.ObjectId(`${subscriptionId}`),
        },
      },
      {
        $lookup: {
          from: 'subscriptionaddons',
          localField: '_id',
          foreignField: 'subscription',
          as: 'addonDetails',
        },
      },
      {
        $project: {
          totalEmployeeLimitAddon: {
            $sum: {
              $map: {
                input: '$addonDetails',
                as: 'addon',
                in: { $ifNull: ['$$addon.employeeLimit', 0] },
              },
            },
          },
          totalContactLimitAddon: {
            $sum: {
              $map: {
                input: '$addonDetails',
                as: 'addon',
                in: { $ifNull: ['$$addon.contactLimit', 0] },
              },
            },
          },
        },
      },
    ];

    const result = await this.SubscriptionModel.aggregate(pipeline).exec();
    if (result && result.length === 0) {
      throw new NotFoundException('No addons found');
    } else {
      subscription.employeeLimitAddon = result[0].totalEmployeeLimitAddon;
      subscription.contactLimitAddon = result[0].totalContactLimitAddon;
      await subscription.save();
    }
    console.log('result -------- >', result);
    return result;
  }

  async revalidateUsedContactCounts() {
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'attendees',
          let: { adminId: '$admin' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$adminId', '$$adminId'],
                },
              },
            },
            {
              $group: {
                _id: '$email',
              },
            },
            {
              $count: 'total',
            },
          ],
          as: 'attendeeCount',
        },
      },
      {
        $unwind: {
          path: '$attendeeCount',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          contactCount: {
            $ifNull: ['$attendeeCount.total', 0],
          },
        },
      },
      {
        $project: {
          attendeeCount: 0,
        },
      },
      {
        $merge: {
          into: 'subscriptions',
          on: '_id',
          whenMatched: 'merge',
          whenNotMatched: 'discard',
        },
      },
    ];

    return this.SubscriptionModel.aggregate(pipeline).exec();
  }
}
