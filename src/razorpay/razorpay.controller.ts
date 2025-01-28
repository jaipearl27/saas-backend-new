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
import { RazorPayAddOnDTO, RazorPayUpdatePlanDTO } from './dto/razorpay.dto';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto'
@Controller('razorpay')
export class RazorpayController {
  constructor(
    private razorpayService: RazorpayService,
    private plansService: PlansService,
    private addonService: AddOnService,
    private subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
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
    @Query() query: RazorPayUpdatePlanDTO,
  ): Promise<any> {
    //validate payment success here

    const expectedSignature = crypto
    .createHmac("sha256", this.configService.get('RAZORPAY_KEY_SECRET'))
    .update(body.toString())
    .digest("hex");

    if(body.razorpay_signature !== expectedSignature){
      return { url: 'http://localhost:5173/failed' };
    }



    const planUpdate = await this.subscriptionService.updateClientPlan(
      query.adminId,
      query.planId,
      query.durationType,
    );
    const env = this.configService.get('NEST_ENV');
    if (planUpdate) {
      return {
        url:
          env === 'development'
            ? 'http://localhost:5173/plans'
            : 'https://saas.rittikbansal.com/plans',
      };
    } else {
      return { url: 'http://localhost:5173/failed' };
    }
  }

  @Post('/addon/checkout')
  async createAddonOrder(@Body('addon') addon: string): Promise<any> {
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
    @Query() query: RazorPayAddOnDTO,
  ): Promise<any> {
    const addonUpdate = await this.subscriptionService.addAddonToSubscription(
      query.adminId,
      query.addonId,
    );

    const env = this.configService.get('NEST_ENV');
    if (addonUpdate) {
      return {
        url:
          env === 'development'
            ? `http://localhost:5173/addons/${query.adminId}`
            : `https://saas.rittikbansal.com/addons/${query.adminId}`,
      };
    } else {
      return { url: 'http://localhost:5173/failed' };
    }
  }
}
