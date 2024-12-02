import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/User.schema';
import { Plans, PlansSchema } from 'src/schemas/Plans.schema';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { BillingHistoryModule } from 'src/billing-history/billing-history.module';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { Roles, RolesSchema } from 'src/schemas/Roles.schema';

@Module({
  imports: [
    BillingHistoryModule,
    SubscriptionModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Plans.name,
        schema: PlansSchema,
      },
      {
        name: Roles.name,
        schema: RolesSchema,
      }
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthTokenMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.PATCH },
        { path: 'users/password', method: RequestMethod.PATCH },
      );

    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'users/employees', method: RequestMethod.ALL });

    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes({ path: 'users/clients/*', method: RequestMethod.ALL });
  }
}
