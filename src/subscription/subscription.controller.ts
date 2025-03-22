import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AdminId, Id, Plan } from 'src/decorators/custom.decorator';
import { SubscriptionService } from './subscription.service';
import {
  AddAddOnDTO,
  UpdatePlanDTO,
  ValidateUserEligibilityDTO,
} from './dto/subscription.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@AdminId() adminId: string) {
    return await this.subscriptionService.getSubscription(adminId);
  }

  @Get('validate')
  async validateUserEligibility(
    @Id() adminId: string,
    @Query() query: ValidateUserEligibilityDTO,
  ) {
    return await this.subscriptionService.validateUserEligibility(
      adminId,
      query.planId,
      query.durationType,
    );
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
      body.durationType,
    );
  }
}
