import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { WebinarService } from './webinar.service';
import { WebinarController } from './webinar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Webinar, WebinarSchema } from 'src/schemas/Webinar.schema';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AttendeesModule } from 'src/attendees/attendees.module';

@Module({
  imports: [
    AttendeesModule,
    MongooseModule.forFeature([
      {
        name: Webinar.name,
        schema: WebinarSchema
      }
    ])
  ],
  providers: [WebinarService],
  controllers: [WebinarController]
})
export class WebinarModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(AuthAdminTokenMiddleware)
    .forRoutes({path: 'webinar', method: RequestMethod.ALL}, {path: 'webinar/*', method: RequestMethod.ALL})
  }
}

