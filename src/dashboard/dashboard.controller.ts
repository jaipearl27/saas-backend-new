import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {

    constructor(
        private readonly dashboardService: DashboardService,
    ){}

    @Get('superAdmin')
    async superAdminDashboard(@Query() query: {startDate: string, endDate: string}): Promise<any>{
        const result = await this.dashboardService.superAdminDashboard(query.startDate, query.endDate)
        return result
    }
}
