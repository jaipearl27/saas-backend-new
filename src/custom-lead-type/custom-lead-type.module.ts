import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { CustomLeadTypeController } from './custom-lead-type.controller';
import { CustomLeadTypeService } from './custom-lead-type.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CustomLeadType,
  CustomLeadTypeSchema,
} from 'src/schemas/custom-lead-type.schema';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      {
        name: CustomLeadType.name,
        schema: CustomLeadTypeSchema,
      },
    ]),
  ],
  controllers: [CustomLeadTypeController],
  providers: [CustomLeadTypeService],
})
export class CustomLeadTypeModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes(
        { path: 'custom-lead-type', method: RequestMethod.POST },
        { path: 'custom-lead-type/:leadTypeId', method: RequestMethod.PATCH },
        { path: 'custom-lead-type/:leadTypeId', method: RequestMethod.DELETE },
      );

    consumer.apply(GetAdminIdMiddleware).forRoutes({
      path: 'custom-lead-type',
      method: RequestMethod.GET,
    });
  }
}
