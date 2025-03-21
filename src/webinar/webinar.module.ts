import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { WebinarService } from './webinar.service';
import { WebinarController } from './webinar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Webinar, WebinarSchema } from 'src/schemas/Webinar.schema';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { UsersModule } from 'src/users/users.module';
import { NotificationModule } from 'src/notification/notification.module';
import { NotesModule } from 'src/notes/notes.module';
import { AlarmModule } from 'src/alarm/alarm.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      {
        name: Webinar.name,
        schema: WebinarSchema,
      },
    ]),
    forwardRef(() => AttendeesModule),
    forwardRef(() => AlarmModule),
    NotificationModule,
    forwardRef(() => AssignmentModule),
    forwardRef(() => NotesModule),
    forwardRef(() => SubscriptionModule),
    EnrollmentsModule,

  ],
  providers: [WebinarService],
  controllers: [WebinarController],
  exports: [WebinarService],
})
export class WebinarModule {
  configure(consumer: MiddlewareConsumer) {
    
    consumer
      .apply(GetAdminIdMiddleware)
      .forRoutes({ path: 'webinar', method: RequestMethod.GET });
    consumer
      .apply(AuthAdminTokenMiddleware)
      .exclude({ path: 'webinar', method: RequestMethod.GET })
      .forRoutes(
        { path: 'webinar', method: RequestMethod.POST },
        { path: 'webinar/*', method: RequestMethod.ALL },
      );

  }
}
