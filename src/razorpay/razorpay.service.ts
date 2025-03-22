import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import Razorpay from 'razorpay';
import { AddOnService } from 'src/addon/addon.service';
import { AttendeesService } from 'src/attendees/attendees.service';
import { PlansService } from 'src/plans/plans.service';
import {
  DurationType,
  monthMultiplier,
} from 'src/schemas/BillingHistory.schema';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RazorpayService {
  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
    private readonly plansService: PlansService,
    private readonly attendeesService: AttendeesService,
    private readonly userService: UsersService,
    private readonly addonService: AddOnService,
  ) {}

  async createOrder(amount: number) {
    console.log(' - ---------- > ', amount, typeof amount);
    const instance = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });

    const options = {
      amount: Math.floor(amount * 100),
      currency: 'INR',
    };
    console.log(options);
    const result = instance.orders.create(options);
    return result;
  }

  async createPlanOrder(
    planId: string,
    durationType: DurationType,
    adminId: string,
  ) {
    const { totalWithGST, planData, isEligible } =
      await this.subscriptionService.validateUserEligibility(
        adminId,
        planId,
        durationType,
      );

    if (!isEligible) {
      throw new BadRequestException('You cannot downgrade the plan');
    } 

    const result = await this.createOrder(totalWithGST);
    return { planData, result };
  }

  async createAddonOrder(addon: string, adminId: string) {
    const subscription =
      await this.subscriptionService.getSubscription(adminId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const addonData = await this.addonService.getAddOnById(addon);

    if (!addonData) throw new NotAcceptableException('Addon not found.');

    const { totalAmount } = this.subscriptionService.generatePriceForAddon(
      addonData.addOnPrice,
    );
    const result = await this.createOrder(totalAmount);
    return { addonData, result };
  }
}
