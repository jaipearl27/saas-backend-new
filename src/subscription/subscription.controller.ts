import { Controller, Get } from '@nestjs/common';
import { AdminId, Plan } from 'src/decorators/custom.decorator';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@AdminId() adminId: string) {
    return await this.subscriptionService.getSubscription(adminId);
  }
}
