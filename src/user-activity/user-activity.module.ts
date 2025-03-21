import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserActivity,
  UserActivitySchema,
} from 'src/schemas/UserActivity.schema';
import { UserActivityController } from './user-activity.controller';
import { UserActivityService } from './user-activity.service';
import { User, UserSchema } from 'src/schemas/User.schema';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { GetAdminIdForUserActivityMiddleware } from 'src/middlewares/getAdminIdForUserActivity.Middleware';
import { NotificationModule } from 'src/notification/notification.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserActivity.name, schema: UserActivitySchema },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    UsersModule,
    JwtModule.register({
      global: true,
    }),
    NotificationModule
  ],
  controllers: [UserActivityController],
  providers: [UserActivityService, ConfigService],
  exports: [UserActivityService],
})
export class UserActivityModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetAdminIdForUserActivityMiddleware)
      .forRoutes(UserActivityController);
  }
}
