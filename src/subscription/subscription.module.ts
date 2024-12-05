import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/schemas/Subscription.schema';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService]
})
export class SubscriptionModule {
  configure(consumer: MiddlewareConsumer) {

    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'subscription', method: RequestMethod.GET });
  }
}
