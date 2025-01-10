import { forwardRef, Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { RazorpayController } from './razorpay.controller';
import { PlansModule } from 'src/plans/plans.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { AddonModule } from 'src/addon/addon.module';

@Module({
  imports: [
    forwardRef(() => PlansModule),
    forwardRef(() => AddonModule),
    forwardRef(() => SubscriptionModule)
  ],
  providers: [RazorpayService],
  controllers: [RazorpayController],
})
export class RazorpayModule {}
