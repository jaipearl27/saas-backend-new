import { Controller, Get, Query } from '@nestjs/common';
import { Id } from 'src/decorators/custom.decorator';
import { BillingHistoryService } from './billing-history.service';

@Controller('billing-history')
export class BillingHistoryController {
  constructor(private readonly billingHistoryService: BillingHistoryService) {}

  @Get()
  async getBillingHistory(
    @Id() adminId: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    const page = Number(query.page) ? Number(query.page) : 1;
    const limit = Number(query.limit) ? Number(query.limit) : 10;

    return await this.billingHistoryService.getBillingHistory(adminId, page, limit);
  }
}
