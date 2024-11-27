import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('superAdmin')
  async superAdminDashboard(
    @Query() query: { startDate: string; endDate: string },
  ): Promise<any> {
    const result = await this.dashboardService.superAdminDashboard(
      query.startDate,
      query.endDate,
    );
    return result;
  }

  @Get('plans')
  async plansMetric(
    @Query() query: { startDate: string; endDate: string },
  ): Promise<any> {
    const result = await this.dashboardService.plansMetric(
      query.startDate,
      query.endDate,
    );
    return result;
  }

  @Get('users')
  async userRegisterationMetrics(
    @Query() query: { startDate: string; endDate: string },
  ): Promise<any> {
    const result = await this.dashboardService.userRegisterationMetrics(
      query.startDate,
      query.endDate,
    );
    return result;
  }

  @Get('revenue')
  async revenueMetrics(
    @Query() query: { startDate: string; endDate: string },
  ): Promise<any> {
    const result = await this.dashboardService.revenueMetrics(
      query.startDate,
      query.endDate,
    );
    return result;
  }
}
