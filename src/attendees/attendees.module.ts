import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendee, AttendeeSchema } from 'src/schemas/Attendee.schema';
import { AttendeesController } from './attendees.controller';
import { AttendeesService } from './attendees.service';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Attendee.name,
        schema: AttendeeSchema,
      },
    ]),
  ],
  controllers: [AttendeesController],
  providers: [AttendeesService],
})
export class AttendeesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'attendees*', method: RequestMethod.ALL });
  }
}
