import { MiddlewareConsumer, Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from 'src/schemas/notification.schema';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService,WebsocketGateway],
  exports: [NotificationService],
})
export class NotificationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthTokenMiddleware)
      .forRoutes(NotificationController);
  }
}
