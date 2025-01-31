import { forwardRef, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { Location, LocationSchema } from 'src/schemas/location.schema';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { UsersModule } from 'src/users/users.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
    ]),
    NotificationModule
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthTokenMiddleware, GetAdminIdMiddleware)
      .exclude(
        { path: 'location*', method: RequestMethod.PATCH },
        { path: 'location*', method: RequestMethod.DELETE },
      )
      .forRoutes({ path: 'location*', method: RequestMethod.ALL });

    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'location*', method: RequestMethod.PATCH });

    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes({ path: 'location*', method: RequestMethod.DELETE });
  }
}
