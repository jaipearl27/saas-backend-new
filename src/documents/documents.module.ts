import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';

@Module({
  controllers: [DocumentsController]
})
export class DocumentsModule {
  configure(consumer: MiddlewareConsumer){
    consumer.apply(AuthSuperAdminMiddleware)
    .forRoutes({path: '/documents', method: RequestMethod.ALL})
  }

}
