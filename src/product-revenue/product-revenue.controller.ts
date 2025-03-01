import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductRevenueService } from './product-revenue.service';
import { Id } from 'src/decorators/custom.decorator';
import { RevenueDto } from 'src/revenue/dto/revenue.dto';

@Controller('product-revenue')
export class ProductRevenueController {
  constructor(
    private readonly productRevenueService: ProductRevenueService,
  ) {}

  @Get('total-revenue')
  async getTotalRevenue(@Id() adminId: string, @Query() params: RevenueDto) {
    const { startDate, endDate } = this.productRevenueService.validateDate(
      params.start,
      params.end,
    );
    const result = await this.productRevenueService.getTotalRevenue(adminId, startDate, endDate);

    return{
      success: true,
      message: 'Total Revenue fetched successfully',
      data: result
    }
  }

  @Get('revenue-by-level')
  async getRevenueByLevel(@Id() adminId: string, @Query() params: RevenueDto) {
    const { startDate, endDate } = this.productRevenueService.validateDate(
      params.start,
      params.end,
    );
    const result = await this.productRevenueService.getRevenueByLevel(adminId, startDate, endDate);
    
    return {
      success: true,
      message: 'Revenue by level fetched successfully',
      data: result
    }
  }

  @Get('adoption-rate')
  async getAdoptionRate(@Id() adminId: string, @Query() params: RevenueDto) {
    const { startDate, endDate } = this.productRevenueService.validateDate(
      params.start,
      params.end,
    );
    const result = await this.productRevenueService.getAdoptionRate(adminId, startDate, endDate);
    
    return {
      success: true,
      message: 'Adoption rate fetched successfully',
      data: result
    }
  }

  @Get('top-products')
  async getTopProducts(
    @Id() adminId: string,
     @Query() params: RevenueDto
  ) {
    const { startDate, endDate } = this.productRevenueService.validateDate(
      params.start,
      params.end,
    );
    const result = await this.productRevenueService.getTopProducts(adminId, startDate, endDate);
    
    return {
      success: true,
      message: 'Top products fetched successfully',
      data: result
    }
  }

  @Get('webinar')
  async getRevenueByWebinar(
    @Id() adminId: string,
     @Query() params: RevenueDto
  ) {
    const result = await this.productRevenueService.getRevenueByWebinar(adminId);
    
    return {
      success: true,
      message: 'Webinar revenue fetched successfully',
      data: result
    }
  }

  @Get('top-users')
  async getTopUsers(
    @Id() adminId: string,
    @Query() params: RevenueDto
  ) {
    const { startDate, endDate } = this.productRevenueService.validateDate(
      params.start,
      params.end
    );
    const result = await this.productRevenueService.getTopUsers(
      adminId,
      startDate,
      endDate,
      parseInt(params.limit) || 5
    );
    
    return {
      success: true,
      message: 'Top users fetched successfully',
      data: result
    }
  }

  // @Get('monthly-revenue')
  // async getMonthlyRevenue(@Id() adminId: string) {
  //   return this.productRevenueService.getMonthlyRevenue(adminId);
  // }

//   @Get('arpu/:adminId')
//   async getARPU(@Param('adminId') adminId: string) {
//     return this.productRevenueService.getARPU(adminId);
//   }

//   @Get('sales-velocity/:adminId')
//   async getSalesVelocity(@Param('adminId') adminId: string) {
//     return this.productRevenueService.getSalesVelocity(adminId);
//   }

//   @Get('cohort-analysis/:adminId')
//   async getCohortAnalysis(@Param('adminId') adminId: string) {
//     return this.productRevenueService.getCohortAnalysis(adminId);
//   }

//   @Get('upsell-ratio/:adminId')
//   async getUpsellRatio(@Param('adminId') adminId: string) {
//     return this.productRevenueService.getUpsellRatio(adminId);
//   }
}
