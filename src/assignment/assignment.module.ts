import { forwardRef, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AuthActiveUserMiddleware } from 'src/middlewares/authActiveUser.Middleware';
import { Assignments, AssignmentsSchema } from 'src/schemas/Assignments.schema';
import { UsersModule } from 'src/users/users.module';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { WebinarModule } from 'src/webinar/webinar.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { GetAdminIdForUserActivityMiddleware } from 'src/middlewares/getAdminIdForUserActivity.Middleware';
import { NotificationModule } from 'src/notification/notification.module';
import { TagsModule } from 'src/tags/tags.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => AttendeesModule),
    forwardRef(() => WebinarModule),
    forwardRef(() => SubscriptionModule),
    MongooseModule.forFeature([
      {
        name: Assignments.name,
        schema: AssignmentsSchema,
      },
    ]),
    NotificationModule,
    TagsModule,
    EnrollmentsModule,
  ],
  providers: [AssignmentService],
  controllers: [AssignmentController],
  exports: [AssignmentService]
})
export class AssignmentModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GetAdminIdForUserActivityMiddleware).forRoutes({
      path: 'assignment/reassign',
      method: RequestMethod.PATCH,
    });

    consumer.apply(GetAdminIdMiddleware).forRoutes({
      path: 'assignment/data/:empId',
      method: RequestMethod.POST,
    });

    consumer
      .apply(AuthAdminTokenMiddleware, AuthActiveUserMiddleware)
      .exclude(
        { path: 'assignment/data/:empId', method: RequestMethod.POST },
        {
          path: 'assignment/activityInactivity',
          method: RequestMethod.GET,
        },
        {
          path: 'assignment/reassign',
          method: RequestMethod.PATCH,
        },
        {
          path: 'assignment/metrics/daily',
          method: RequestMethod.GET,
        },
        {
          path: 'assignment/metrics/count',
          method: RequestMethod.GET,
        },
      )
      .forRoutes({ path: 'assignment*', method: RequestMethod.ALL });

    consumer.apply(AuthTokenMiddleware).forRoutes({
      path: 'assignment/activityInactivity',
      method: RequestMethod.GET,
    },
    {
      path: 'assignment/metrics/daily',
      method: RequestMethod.GET,
    },
    {
      path: 'assignment/metrics/count',
      method: RequestMethod.GET,
    },
  
  );
  }
}
