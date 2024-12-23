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
import { CustomLeadTypeModule } from 'src/custom-lead-type/custom-lead-type.module';
import { CustomLeadTypeService } from 'src/custom-lead-type/custom-lead-type.service';
import { CustomLeadType, CustomLeadTypeSchema } from 'src/schemas/custom-lead-type.schema';

@Module({
  imports: [
    UsersModule,
    SubscriptionModule,
    AttendeesModule,
    MongooseModule.forFeature([
      {
        name: Attendee.name,
        schema: AttendeeSchema,
      },
      {
        name: Assignments.name,
        schema: AssignmentsSchema,
      },
      {
        name: CustomLeadType.name,
        schema: CustomLeadTypeSchema,
      }
    ]),
    forwardRef(() => WebinarModule),
  ],
  controllers: [AttendeesController],
  providers: [AttendeesService, CustomLeadTypeService],
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
