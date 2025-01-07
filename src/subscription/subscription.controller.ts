import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { AdminId, Id, Plan } from 'src/decorators/custom.decorator';
import { SubscriptionService } from './subscription.service';
import { AddAddOnDTO, UpdatePlanDTO } from './dto/subscription.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@AdminId() adminId: string) {
    return await this.subscriptionService.getSubscription(adminId);
  }

  @Patch('addOn')
  async addAddonToSubscription(@Body() body: AddAddOnDTO) {
    return await this.subscriptionService.addAddonToSubscription(
      body.adminId,
      body.addonId,
    );
  }

  @Patch('update')
  async updateSubscription(@Body() body: UpdatePlanDTO) {
    return await this.subscriptionService.updateClientPlan(
      body.adminId,
      body.planId,
    );
  }
}
