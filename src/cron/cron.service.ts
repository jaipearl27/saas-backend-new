import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionAddonService } from 'src/subscription-addon/subscription-addon.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly subscriptionAddonService: SubscriptionAddonService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredPlans(): Promise<void> {
    this.logger.log('Checking for expired plans...');
    await this.userService.deactivateExpiredPlans();

    this.logger.log('Resetting daily contact count...');
    await this.userService.resetDailyContactCount();

    this.logger.log('Checking for expired addons...');
    await this.subscriptionAddonService.getExpiredSubscriptionAddons();
  }
}
