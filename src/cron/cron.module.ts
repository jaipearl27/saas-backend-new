import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from 'src/users/users.module';
import { SubscriptionAddonModule } from 'src/subscription-addon/subscription-addon.module';

@Module({
  imports: [ScheduleModule.forRoot(), UsersModule, SubscriptionAddonModule],
  providers: [CronService],
})
export class CronModule {}
