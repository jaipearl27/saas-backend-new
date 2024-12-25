import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AttendeesModule } from './attendees/attendees.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import configurations from './config/configurations';
import { GetAdminIdMiddleware } from './middlewares/get-admin-id.middleware';
import { AuthSuperAdminMiddleware } from './middlewares/authSuperAdmin.Middleware';
import { AuthAdminTokenMiddleware } from './middlewares/authAdmin.Middleware';
import { SidebarLinksModule } from './sidebar-links/sidebar-links.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { BillingHistoryModule } from './billing-history/billing-history.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LandingpageModule } from './landingpage/landingpage.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UserActivityModule } from './user-activity/user-activity.module';
import { WebinarModule } from './webinar/webinar.module';
import { ExportExcelModule } from './export-excel/export-excel.module';
import { CronModule } from './cron/cron.module';
import { RolesModule } from './roles/roles.module';
import { FilterPresetModule } from './filter-preset/filter-preset.module';
import { NoticeBoardModule } from './notice-board/notice-board.module';
import { AssignmentModule } from './assignment/assignment.module';
import { StatusDropdownModule } from './status-dropdown/status-dropdown.module';
import { DocumentsModule } from './documents/documents.module';
import { AlarmModule } from './alarm/alarm.module';
import { ProductsModule } from './products/products.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotesModule } from './notes/notes.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { DeleteDataModule } from './delete-data/delete-data.module';
import { CustomLeadTypeModule } from './custom-lead-type/custom-lead-type.module';
import { AttendeeAssociationModule } from './attendee-association/attendee-association.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configurations],
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AttendeeAssociationModule,
    UsersModule,
    AttendeesModule,
    AuthModule,
    SidebarLinksModule,
    PlansModule,
    SubscriptionModule,
    BillingHistoryModule,
    DashboardModule,
    LandingpageModule,
    UserActivityModule,
    WebinarModule,
    ExportExcelModule,
    CronModule,
    RolesModule,
    FilterPresetModule,
    NoticeBoardModule,
    AssignmentModule,
    StatusDropdownModule,
    DocumentsModule,
    AlarmModule,
    ProductsModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        service: "gmail",
        ignoreTLS: true,
        secure: false,
        auth: {
          user: process.env.MAILDEV_INCOMING_USER,
          pass: process.env.MAILDEV_INCOMING_PASS,
        },
      },
    }),
    NotesModule,
    CloudinaryModule,
    EnrollmentsModule,
    DeleteDataModule,
    CustomLeadTypeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetAdminIdMiddleware)
      .forRoutes({ path: 'users/employee', method: RequestMethod.GET });

    consumer
      .apply(AuthAdminTokenMiddleware)
      .forRoutes({ path: 'auth/employee', method: RequestMethod.POST });

    consumer
      .apply(AuthSuperAdminMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.GET },
        { path: 'users/clients', method: RequestMethod.GET },
        '/documents*',
      );
  }
}
