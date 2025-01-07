import { forwardRef, MiddlewareConsumer, Module } from '@nestjs/common';
import { AttendeeAssociationController } from './attendee-association.controller';
import { AttendeeAssociationService } from './attendee-association.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AttendeeAssociation,
  AttendeeAssociationSchema,
} from 'src/schemas/attendee-association.schema';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      {
        name: AttendeeAssociation.name,
        schema: AttendeeAssociationSchema,
      },
    ]),
  ],
  controllers: [AttendeeAssociationController],
  providers: [AttendeeAssociationService],
  exports:[AttendeeAssociationService]
})
export class AttendeeAssociationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetAdminIdMiddleware)
      .forRoutes(AttendeeAssociationController);
  }
}
