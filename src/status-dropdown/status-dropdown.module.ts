import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { StatusDropdownController } from './status-dropdown.controller';
import { StatusDropdownService } from './status-dropdown.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StatusDropdown,
  StatusDropdownSchema,
} from 'src/schemas/StatusDropdown.schema';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { RolesService } from 'src/roles/roles.service';
import { RolesModule } from 'src/roles/roles.module';
import { Roles, RolesSchema } from 'src/schemas/Roles.schema';
import { GetAdminIdForUserActivityMiddleware } from 'src/middlewares/getAdminIdForUserActivity.Middleware';
import { User, UserSchema } from 'src/schemas/User.schema';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/schemas/Subscription.schema';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StatusDropdown.name,
        schema: StatusDropdownSchema,
      },
      {
        name: Roles.name,
        schema: RolesSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
    ]),
    UsersModule,
  ],
  controllers: [StatusDropdownController],
  providers: [StatusDropdownService, RolesService, SubscriptionService],
})
export class StatusDropdownModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'status-dropdown', method: RequestMethod.POST });
      
    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'status-dropdown/:id', method: RequestMethod.DELETE });

    consumer
      .apply(GetAdminIdMiddleware)
      .forRoutes(
        { path: 'status-dropdown', method: RequestMethod.GET },
        { path: 'status-dropdown/filter', method: RequestMethod.GET },
      );
  }
}
