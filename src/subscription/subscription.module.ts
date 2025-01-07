import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/schemas/Subscription.schema';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { UsersModule } from 'src/users/users.module';
import { AddonModule } from 'src/addon/addon.module';
import { SubscriptionAddonModule } from 'src/subscription-addon/subscription-addon.module';
import { BillingHistoryModule } from 'src/billing-history/billing-history.module';
import { PlansModule } from 'src/plans/plans.module';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';
import { AttendeesModule } from 'src/attendees/attendees.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => SubscriptionAddonModule),
    forwardRef(() => AttendeesModule),
    BillingHistoryModule,
    forwardRef(() => AddonModule),
    PlansModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthTokenMiddleware, GetAdminIdMiddleware)
      .forRoutes({ path: 'subscription', method: RequestMethod.GET });

    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes(
        { path: 'subscription/addOn', method: RequestMethod.PATCH },
        { path: 'subscription/update', method: RequestMethod.PATCH },
      );
  }
}
