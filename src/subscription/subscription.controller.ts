import { Controller, Get } from '@nestjs/common';
import { Id, Plan } from 'src/decorators/custom.decorator';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  getSubscription(@Id() id: string) {
    return this.subscriptionService.getSubscription(id);
  }
}
