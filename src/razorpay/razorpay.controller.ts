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
import {
  RazorPayAddOnDTO,
  RazorPayCheckoutPlanDTO,
  RazorPayUpdatePlanDTO,
} from './dto/razorpay.dto';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import { monthMultiplier } from 'src/schemas/BillingHistory.schema';
import { Id } from 'src/decorators/custom.decorator';
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
  async createOrder(@Body() body: RazorPayCheckoutPlanDTO, @Id() adminId: string): Promise<any> {
    const { plan, durationType } = body;
    return this.razorpayService.createPlanOrder(plan, durationType, adminId);
  }


  @Post('/payment-success')
  @Redirect()
  async paymentSuccess(
    @Body() body: any,
    @Query() query: RazorPayUpdatePlanDTO,
  ): Promise<any> {
    //validate payment success here

    const generatedSignature = crypto
      .createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET'))
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');


    if (generatedSignature !== body.razorpay_signature) {
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
  async createAddonOrder(@Body('addon') addon: string, @Id() adminId: string): Promise<any> {
    return this.razorpayService.createAddonOrder(addon, adminId);
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
