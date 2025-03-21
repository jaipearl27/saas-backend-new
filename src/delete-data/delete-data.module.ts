import { MiddlewareConsumer, Module } from '@nestjs/common';
import { DeleteDataController } from './delete-data.controller';
import { DeleteDataService } from './delete-data.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/User.schema';
import { Webinar, WebinarSchema } from 'src/schemas/Webinar.schema';
import { Notes, NotesSchema } from 'src/schemas/Notes.schema';
import { Attendee, AttendeeSchema } from 'src/schemas/Attendee.schema';
import { AttendeeAssociation, AttendeeAssociationSchema } from 'src/schemas/attendee-association.schema';
import { BillingHistory, BillingHistorySchema } from 'src/schemas/BillingHistory.schema';
import { CustomLeadType, CustomLeadTypeSchema } from 'src/schemas/custom-lead-type.schema';
import { Enrollment, EnrollmentSchema } from 'src/schemas/Enrollments.schema';
import { Products, ProductsSchema } from 'src/schemas/Products.schema';
import { StatusDropdown, StatusDropdownSchema } from 'src/schemas/StatusDropdown.schema';
import { Subscription, SubscriptionSchema } from 'src/schemas/Subscription.schema';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';
import { Alarm, AlarmSchema } from 'src/schemas/Alarm.schema';
import { NoticeBoard, NoticeBoardSchema } from 'src/schemas/notice-board.schema';
import { Notification, NotificationSchema } from 'src/schemas/notification.schema';
import { UserActivity, UserActivitySchema } from 'src/schemas/UserActivity.schema';
import { FilterPreset, FilterPresetSchema } from 'src/schemas/FilterPreset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      },
      {
        name: Webinar.name,
        schema: WebinarSchema
      },
      {
        name: Notes.name,
        schema: NotesSchema
      },
      {
        name: Attendee.name,
        schema: AttendeeSchema
      },
      {
        name: AttendeeAssociation.name,
        schema: AttendeeAssociationSchema
      },
      {
        name: BillingHistory.name,
        schema: BillingHistorySchema
      },
      {
        name: CustomLeadType.name,
        schema: CustomLeadTypeSchema
      },
      {
        name: Enrollment.name,
        schema: EnrollmentSchema
      },
      {
        name: Products.name,
        schema: ProductsSchema
      },
      {
        name: StatusDropdown.name,
        schema: StatusDropdownSchema
      },
      {
        name: Subscription.name,
        schema: SubscriptionSchema
      }, 

      {
        name: Alarm.name,
        schema: AlarmSchema
      },

      {
        name: NoticeBoard.name,
        schema: NoticeBoardSchema
      },

      {
        name: Notification.name,
        schema: NotificationSchema
      },

      {
        name: UserActivity.name,
        schema: UserActivitySchema
      },

      {
        name: FilterPreset.name,
        schema: FilterPresetSchema
      },

    ])
  ],
  controllers: [DeleteDataController],
  providers: [DeleteDataService]
})
export class DeleteDataModule {
  configure(consumer: MiddlewareConsumer){
    consumer.apply(AuthSuperAdminMiddleware)
      .forRoutes('delete-data')
  }
}
