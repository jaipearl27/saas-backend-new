import {
  Body,
  Controller,
  Get,
  NotAcceptableException,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { PlansService } from 'src/plans/plans.service';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Controller('razorpay')
export class RazorpayController {
  constructor(
    private razorpayService: RazorpayService,
    private plansService: PlansService,
    private subscriptionService: SubscriptionService,
  ) {}

  @Post('checkout')
  async createOrder(@Body('plan') plan: string): Promise<any> {
    const planData = await this.plansService.getPlan(plan);

    if (!planData) throw new NotAcceptableException('Plan not found.');

    const result = await this.razorpayService.createOrder(planData.amount);
    return { planData, result };
  }

  @Post('payment-success')
  @Redirect()
  async paymentSuccess(
    @Body() body: any,
    @Query() query: { planId: string; adminId: string },
  ): Promise<any> {
    const planUpdate = await this.subscriptionService.updateClientPlan(
      query.adminId,
      query.planId,
    );
    if(planUpdate) {
      return { url: 'http://localhost:5173' };
    } else {
      return {url: 'http://localhost:5173/failed'}
    }
  }

  @Post('addon/checkout')
  async createAddonOrder(@Body('plan') plan: string): Promise<any> {
    const planData = await this.plansService.getPlan(plan);

    if (!planData) throw new NotAcceptableException('Plan not found.');
    console.log(planData);
    const result = await this.razorpayService.createOrder(planData.amount);
    return { planData, result };
  }

  @Post('addon/payment-success')
  @Redirect()
  async addonPaymentSuccess(@Body() body: any): Promise<any> {
    console.log('razorpay body', body);
    return { url: 'http://localhost:5173' };
  }
}
