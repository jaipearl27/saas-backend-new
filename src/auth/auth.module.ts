import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/User.schema';
import { Plans, PlansSchema } from 'src/schemas/Plans.schema';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Plans.name,
        schema: PlansSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
