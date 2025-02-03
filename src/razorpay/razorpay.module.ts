import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { RazorpayController } from './razorpay.controller';
import { PlansModule } from 'src/plans/plans.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { AddonModule } from 'src/addon/addon.module';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => PlansModule),
    forwardRef(() => AddonModule),
    forwardRef(() => SubscriptionModule),
    AttendeesModule,
    UsersModule,
  ],
  providers: [RazorpayService],
  controllers: [RazorpayController],

})
export class RazorpayModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'razorpay/checkout', method: RequestMethod.POST });
  }
}
