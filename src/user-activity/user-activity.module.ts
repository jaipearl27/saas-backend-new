import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserActivity,
  UserActivitySchema,
} from 'src/schemas/UserActivity.schema';
import { UserActivityController } from './user-activity.controller';
import { UserActivityService } from './user-activity.service';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { User, UserSchema } from 'src/schemas/User.schema';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';

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
  ],
  controllers: [UserActivityController],
  providers: [UserActivityService],
})
export class UserActivityModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetAdminIdMiddleware)
      .forRoutes(UserActivityController);
  }
}
