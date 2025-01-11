import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { Location, LocationSchema } from 'src/schemas/location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
    ]),
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'location*', method: RequestMethod.POST });

    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes({ path: 'location*', method: RequestMethod.PATCH });
  }
}
