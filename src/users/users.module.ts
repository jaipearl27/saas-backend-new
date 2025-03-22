import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
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
import {
  Subscription,
  SubscriptionSchema,
} from 'src/schemas/Subscription.schema';
import { diskStorage } from 'multer';
import { MulterModule } from '@nestjs/platform-express';
import { CustomLeadTypeService } from 'src/custom-lead-type/custom-lead-type.service';
import {
  CustomLeadType,
  CustomLeadTypeSchema,
} from 'src/schemas/custom-lead-type.schema';
import { CustomLeadTypeModule } from 'src/custom-lead-type/custom-lead-type.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './documents',
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
    forwardRef(() => SubscriptionModule),
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
      },
      {
        name: CustomLeadType.name,
        schema: CustomLeadTypeSchema,
      },
    ]),
    BillingHistoryModule,
    NotificationModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, CustomLeadTypeService],
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
      .forRoutes(
        { path: 'users/employee*', method: RequestMethod.ALL },
        { path: 'users/document*', method: RequestMethod.DELETE },
        { path: 'users/super-admin', method: RequestMethod.GET },
      );

    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes(
        { path: 'users/clients/*', method: RequestMethod.ALL },
        {
          path: 'users/super-admin/whatsapp-token',
          method: RequestMethod.PATCH,
        },
      );
  }
}
