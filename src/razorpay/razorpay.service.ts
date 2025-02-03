import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import Razorpay from 'razorpay';
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
  ) {}

  async createOrder(amount: number) {
    console.log(' - ---------- > ',amount, typeof amount);
    const instance = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });

    const options = {
      amount: Math.floor(amount * 100),
      currency: 'INR',
    };
    console.log(options)
    const result = instance.orders.create(options);
    return result;
  }

  async createPlanOrder(
    planId: string,
    durationType: DurationType,
    adminId: string,
  ) {
    const subscription =
      await this.subscriptionService.getSubscription(adminId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with admin ID ${adminId} not found`,
      );
    }

    const usedContacts = await this.attendeesService.getNonUniqueAttendeesCount(
      [],
      new Types.ObjectId(`${adminId}`),
    );
    const usedEmployees = await this.userService.getEmployeesCount(adminId);

    const plan = await this.plansService.getPlan(planId);

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
    if (!durationConfig)
      throw new NotAcceptableException('Duration type not found.');

    const { totalWithGST } =
      await this.subscriptionService.generatePriceForPlan(
        plan.amount,
        durationType,
        durationConfig,
      );

    const result = await this.createOrder(totalWithGST);
    return { planData: plan, result };
  }
}
