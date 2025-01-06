import { Controller, Get, Param, Patch } from '@nestjs/common';
import { AdminId, Id, Plan } from 'src/decorators/custom.decorator';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@AdminId() adminId: string) {
    return await this.subscriptionService.getSubscription(adminId);
  }

  @Patch('addOn/:id')
  async addAddonToSubscription(
    @Id() adminId: string,
    @Param('id') id: string,
  ) {
    return await this.subscriptionService.addAddonToSubscription(adminId, id);
  }
}
