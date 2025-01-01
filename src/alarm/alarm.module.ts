import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AlarmController } from './alarm.controller';
import { AlarmService } from './alarm.service';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { Alarm, AlarmSchema } from 'src/schemas/Alarm.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Alarm.name,
        schema: AlarmSchema,
      },
    ]),
  ],
  controllers: [AlarmController],
  providers: [AlarmService],
  exports: [AlarmService],
})
export class AlarmModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthTokenMiddleware)
      .forRoutes({ path: 'alarm', method: RequestMethod.ALL });
  }
}
