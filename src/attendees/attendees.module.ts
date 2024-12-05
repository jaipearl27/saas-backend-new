import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendee, AttendeeSchema } from 'src/schemas/Attendee.schema';
import { AttendeesController } from './attendees.controller';
import { AttendeesService } from './attendees.service';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      {
        name: Attendee.name,
        schema: AttendeeSchema,
      },
    ]),
  ],
  controllers: [AttendeesController],
  providers: [AttendeesService],
  exports: [AttendeesService],
})
export class AttendeesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .exclude({ path: 'attendees/:id', method: RequestMethod.GET })
      .forRoutes({ path: 'attendees*', method: RequestMethod.ALL });

    consumer
      .apply(AuthTokenMiddleware, GetAdminIdMiddleware)
      .forRoutes(
        { path: 'attendees/:id', method: RequestMethod.GET },
        { path: 'attendees/:id', method: RequestMethod.PATCH },
      );
  }
}
