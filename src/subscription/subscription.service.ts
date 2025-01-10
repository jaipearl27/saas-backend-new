import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Subscription } from 'src/schemas/Subscription.schema';
import { SubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { AddOnService } from 'src/addon/addon.service';
import { BillingHistoryService } from 'src/billing-history/billing-history.service';
import { SubscriptionAddonService } from 'src/subscription-addon/subscription-addon.service';
import { PlansService } from 'src/plans/plans.service';
import { AttendeesService } from 'src/attendees/attendees.service';
import { UsersService } from 'src/users/users.service';

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
        )
        .catch(() => {
          throw new Error('Failed to create subscription addon');
        });

      const billing = await this.BillingHistoryService.addOneBillingHistory(
        adminId,
        addonId,
        addOn.addOnPrice,
      ).catch(() => {
        throw new Error('Failed to create billing history');
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
    console.log(result);
    await result.save({ session });
    return result;
  }

  async updateClientPlan(adminId: string, planId: string) {
    const subscription = await this.SubscriptionModel.findOne({
      admin: new Types.ObjectId(`${adminId}`),
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with admin ID ${adminId} not found`,
      );
    }

    const isPlanExpired = new Date() > new Date(subscription.expiryDate);

    const usedContacts = await this.attendeesService.getAttendeesCount(
      '',
      adminId,
    );
    const usedEmployees = await this.userService.getEmployeesCount(adminId);

    const plan = await this.plansService.getPlan(planId);

    if (usedContacts > plan.contactLimit) {
      throw new BadRequestException('You cannot downgrade the plan');
    }

    if (usedEmployees > plan.employeeCount) {
      throw new BadRequestException('You cannot downgrade the plan');
    }

    subscription.plan = new Types.ObjectId(`${planId}`);
    subscription.contactLimit = plan.contactLimit;
    subscription.employeeLimit = plan.employeeCount;
    subscription.toggleLimit = plan.toggleLimit;
    subscription.startDate = new Date();

    subscription.expiryDate = new Date(
      Date.now() + plan.planDuration * 24 * 60 * 60 * 1000,
    );

    const billing = await this.BillingHistoryService.addBillingHistory({
      admin: adminId,
      plan: planId,
      amount: plan.amount,
    });

    if (isPlanExpired)
      await this.userService.updateClient(adminId, { isActive: true });

    await subscription.save();
    return { subscription, billing };
  }
}
