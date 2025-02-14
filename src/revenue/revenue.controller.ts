import { Controller, Get, Query } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { RevenueDto, TopItemsDto, RevenueTrendDto } from './dto/revenue.dto';

@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('total')
  async getTotalRevenue(@Query() params: RevenueDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getTotalRevenue(startDate, endDate);
  }

  @Get('by-type')
  async getRevenueByType(@Query() params: RevenueDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getRevenueByType(startDate, endDate);
  }

  @Get('duration')
  async getDurationRevenue(@Query() params: RevenueDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getDurationRevenue(startDate, endDate);
  }

  @Get('mrr')
  async getMRR(@Query() params: RevenueDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getMRR(startDate, endDate);
  }

  @Get('tax')
  async getTaxCollected(@Query() params: RevenueDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getTaxCollected(startDate, endDate);
  }

  @Get('discounts')
  async getDiscountsGiven(@Query() params: RevenueDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getDiscountsGiven(startDate, endDate);
  }

  @Get('trend')
  async getRevenueTrend(@Query() params: RevenueTrendDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getRevenueTrend(
      startDate,
      endDate,
      params.interval,
    );
  }

  @Get('arpu')
  async getARPU(@Query() params: RevenueDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getARPU(startDate, endDate);
  }

  @Get('renewal-metrics')
  async getRenewalMetrics(@Query() params: RevenueDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getRenewalMetrics(startDate, endDate);
  }

  @Get('top-plans')
  async getTopPlans(@Query() params: TopItemsDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getTopPlans(
      startDate,
      endDate,
      parseInt(params.limit) || 5,
    );

  }

  @Get('top-addons')
  async getTopAddOns(@Query() params: TopItemsDto) {
    const { startDate, endDate } = this.revenueService.validateDate(
      params.start,
      params.end,
    );
    return await this.revenueService.getTopAddOns(
      startDate,
      endDate,
      parseInt(params.limit) || 5,

    );
  }
}
