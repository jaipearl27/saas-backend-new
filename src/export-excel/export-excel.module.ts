import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ExportExcelController } from './export-excel.controller';
import { ExportExcelService } from './export-excel.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { UsersModule } from 'src/users/users.module';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { ValidateBodyFilters } from 'src/middlewares/validate-body-filters.Middleware';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { WebinarModule } from 'src/webinar/webinar.module';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import {
  UserDocuments,
  UserDocumentsSchema,
} from 'src/schemas/user-documents.schema';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { CustomLeadTypeModule } from 'src/custom-lead-type/custom-lead-type.module';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserDocuments.name, schema: UserDocumentsSchema },
    ]),
    UsersModule,
    SubscriptionModule,
    WebinarModule,
    AttendeesModule,
    CustomLeadTypeModule,
  ],
  controllers: [ExportExcelController],
  providers: [ExportExcelService, WebsocketGateway],
  exports: [ExportExcelService],
})
export class ExportExcelModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthAdminTokenMiddleware, ValidateBodyFilters).forRoutes(
      {
        path: 'export-excel/webinar-attendees',
        method: RequestMethod.POST,
      },
      {
        path: 'export-excel/attendees',
        method: RequestMethod.POST,
      },
    );
    consumer.apply(AuthAdminTokenMiddleware).forRoutes(
      { path: 'export-excel/webinars', method: RequestMethod.POST },
      {
        path: 'export-excel/employees',
        method: RequestMethod.POST,
      },
      { path: 'export-excel/user-documents', method: RequestMethod.GET },
      { path: 'export-excel/user-documents/:id', method: RequestMethod.GET },
      { path: 'export-excel/user-documents/:id', method: RequestMethod.DELETE },
    );
    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes({ path: 'export-excel/client', method: RequestMethod.POST });
  }
}
