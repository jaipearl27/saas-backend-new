import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AlarmController } from './alarm.controller';
import { AlarmService } from './alarm.service';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';

@Module({
  controllers: [AlarmController],
  providers: [AlarmService]
})
export class AlarmModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthTokenMiddleware)
    .forRoutes({path: 'alarm', method: RequestMethod.ALL})
  }
}
