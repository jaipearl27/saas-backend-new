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

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configurations],
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    UsersModule,
    AttendeesModule,
    AuthModule,
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
      .forRoutes('users', 'users/clients');
  }
}
