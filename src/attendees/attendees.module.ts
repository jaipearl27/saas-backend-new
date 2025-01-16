import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendee, AttendeeSchema } from 'src/schemas/Attendee.schema';
import { AttendeesController } from './attendees.controller';
import { AttendeesService } from './attendees.service';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { UsersModule } from 'src/users/users.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { ValidateBodyFilters } from 'src/middlewares/validate-body-filters.Middleware';
import { Assignments, AssignmentsSchema } from 'src/schemas/Assignments.schema';
import { WebinarModule } from 'src/webinar/webinar.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => SubscriptionModule),
    MongooseModule.forFeature([
      {
        name: Attendee.name,
        schema: AttendeeSchema,
      },
      {
        name: Assignments.name,
        schema: AssignmentsSchema,
      },
    ]),
    forwardRef(() => WebinarModule),
    NotificationModule
  ],
  controllers: [AttendeesController],
  providers: [AttendeesService],
  exports: [AttendeesService],
})
export class AttendeesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes(
        { path: 'attendees', method: RequestMethod.POST },
      );

    consumer
      .apply(AuthTokenMiddleware, GetAdminIdMiddleware)
      .forRoutes(
        { path: 'attendees', method: RequestMethod.GET },
        { path: 'attendees/:email', method: RequestMethod.GET },
        { path: 'attendees/:id', method: RequestMethod.PATCH },
        { path: 'attendees/lead-type/:id', method: RequestMethod.PATCH },
      );

    consumer
      .apply(AuthTokenMiddleware, GetAdminIdMiddleware, ValidateBodyFilters)
      .forRoutes(
        { path: 'attendees/webinar', method: RequestMethod.POST },
      );
  }
}
