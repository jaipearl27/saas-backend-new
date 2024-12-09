import { forwardRef, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
    ]),
    forwardRef(() => UsersModule)
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
  }
}
