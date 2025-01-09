import { Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { RazorpayController } from './razorpay.controller';

@Module({
  providers: [RazorpayService],
  controllers: [RazorpayController]
})
export class RazorpayModule {}
