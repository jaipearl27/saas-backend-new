import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Subscription } from 'src/schemas/Subscription.schema';
import { SubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { AddOnService } from 'src/addon/addon.service';
import { BillingHistoryService } from 'src/billing-history/billing-history.service';
import { SubscriptionAddonService } from 'src/subscription-addon/subscription-addon.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private SubscriptionModel: Model<Subscription>,
    private readonly addOnService: AddOnService,
    @Inject(forwardRef(() => SubscriptionAddonService))
    private readonly subscriptionAddonService: SubscriptionAddonService,
    private readonly BillingHistoryService: BillingHistoryService,
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

  
      const subscriptionAddon =
        await this.subscriptionAddonService.createSubscriptionAddon(
          subscription._id as string,
          addOnExpiry,
          addOn._id as string,
        ).catch(() => {
          throw new Error('Failed to create subscription addon');
        });
  
      const billing = await this.BillingHistoryService.addOneBillingHistory(
        adminId,
        addonId,
        addOn.addOnPrice,
      ).catch(() => {
        throw new Error('Failed to create billing history');
      });
  
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
    session: ClientSession
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
  
  
}
