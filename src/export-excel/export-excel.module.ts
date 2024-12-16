import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ExportExcelController } from './export-excel.controller';
import { ExportExcelService } from './export-excel.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { UsersModule } from 'src/users/users.module';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { ValidateBodyFilters } from 'src/middlewares/validate-body-filters.Middleware';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema },]), UsersModule,SubscriptionModule, AttendeesModule],
  controllers: [ExportExcelController],
  providers: [ExportExcelService,],
})
export class ExportExcelModule {
  configure(consumer: MiddlewareConsumer) {

    consumer
    .apply(AuthTokenMiddleware, GetAdminIdMiddleware, ValidateBodyFilters)
    .forRoutes({ path: 'export-excel/webinar-attendees/:id', method: RequestMethod.POST });
  }
}
