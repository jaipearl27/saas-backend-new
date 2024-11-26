import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/User.schema';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes({ path: 'dashboard/superAdmin', method: RequestMethod.ALL });
  }
}
