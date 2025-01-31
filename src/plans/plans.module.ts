import { forwardRef, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { Plans, PlansSchema } from 'src/schemas/Plans.schema';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Plans.name,
        schema: PlansSchema,
      },
    ]),
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [PlansController],
  providers: [PlansService],
  exports:[PlansService]
})
export class PlansModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .exclude({
        path: 'plans',
        method: RequestMethod.POST,
      })
      .forRoutes({ path: 'plans', method: RequestMethod.GET });

    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes(
        { path: 'plans', method: RequestMethod.POST },
        { path: 'plans/:id', method: RequestMethod.PATCH },
        { path: 'plans/order', method: RequestMethod.PUT },
        { path: 'plans', method: RequestMethod.PUT },
        { path: 'plans', method: RequestMethod.DELETE },
      );
  }
}
