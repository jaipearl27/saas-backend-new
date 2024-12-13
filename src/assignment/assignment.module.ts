import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendee, AttendeeSchema } from 'src/schemas/Attendee.schema';
import { User, UserSchema } from 'src/schemas/User.schema';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AuthActiveUserMiddleware } from 'src/middlewares/authActiveUser.Middleware';
import { Assignments, AssignmentsSchema } from 'src/schemas/Assignments.schema';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { WebinarModule } from 'src/webinar/webinar.module';
import { WebinarService } from 'src/webinar/webinar.service';
import { Webinar, WebinarSchema } from 'src/schemas/Webinar.schema';

@Module({
  imports: [
    UsersModule,
    AttendeesModule,
    WebinarModule,
    MongooseModule.forFeature([
      {
        name: Assignments.name,
        schema: AssignmentsSchema,
      },
      {
        name: Attendee.name,
        schema: AttendeeSchema,
      },
      {
        name: Webinar.name,
        schema: WebinarSchema
      }
    ]),
  ],
  providers: [AssignmentService, WebinarService],
  controllers: [AssignmentController],
})
export class AssignmentModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware, AuthActiveUserMiddleware)
      .forRoutes({ path: 'assignment*', method: RequestMethod.ALL });
  }
}
