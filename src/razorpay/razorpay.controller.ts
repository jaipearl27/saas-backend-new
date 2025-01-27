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
import { AddOnService } from 'src/addon/addon.service';

@Controller('razorpay')
export class RazorpayController {
  constructor(
    private razorpayService: RazorpayService,
    private plansService: PlansService,
    private addonService: AddOnService,
    private subscriptionService: SubscriptionService,
  ) {}

  @Post('/checkout')
  async createOrder(@Body('plan') plan: string): Promise<any> {
    const planData = await this.plansService.getPlan(plan);

    if (!planData) throw new NotAcceptableException('Plan not found.');

    const result = await this.razorpayService.createOrder(planData.amount);
    return { planData, result };
  }

  @Post('/payment-success')
  @Redirect()
  async paymentSuccess(
    @Body() body: any,
    @Query() query: { planId: string; adminId: string },
  ): Promise<any> {
    //validate payment success here
    const planUpdate = await this.subscriptionService.updateClientPlan(
      query.adminId,
      query.planId,
    );
    if (planUpdate) {
      return { url: 'http://localhost:5173/plans' };
    } else {
      return { url: 'http://localhost:5173/failed' };
    }
  }

  @Post('/addon/checkout')
  async createAddonOrder(@Body('addon') addon: string): Promise<any> {
    console.log(addon)
    const addonData = await this.addonService.getAddOnById(addon);

    if (!addonData) throw new NotAcceptableException('Addon not found.');
    console.log(addonData);
    const result = await this.razorpayService.createOrder(addonData.addOnPrice);
    return { addonData, result };
  }

  @Post('addon/payment-success')
  @Redirect()
  async addonSuccess(
    @Body() body: any,
    @Query() query: { addonId: string; adminId: string },
  ): Promise<any> {
    const addonUpdate = await this.subscriptionService.addAddonToSubscription(
      query.adminId,
      query.addonId,
    );
    if (addonUpdate) {
      return { url: 'http://localhost:5173/plans' };
    } else {
      return { url: 'http://localhost:5173/failed' };
    }
  }
}
