import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/User.schema';
import { Plans, PlansSchema } from 'src/schemas/Plans.schema';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { BillingHistoryModule } from 'src/billing-history/billing-history.module';

@Module({
  imports: [
    BillingHistoryModule,
    SubscriptionModule,
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
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
