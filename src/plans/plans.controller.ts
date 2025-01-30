import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import {
  CreatePlansDto,
  IdParamsDTO,
  PlanOrderDTO,
} from './dto/createPlans.dto';
import { UpdatePlansDto } from './dto/updatePlans.dto';
import { Id, Role } from 'src/decorators/custom.decorator';
import { Types } from 'mongoose';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async getPlans(
    @Id() userId: string,
    @Role() role: string,
    @Query('isActive') isActive: string,
  ) {
    if (!userId || !role) {
      throw new BadRequestException('User ID and Role is required');
    }
    console.log(isActive);

    return await this.plansService.getPlans(
      new Types.ObjectId(userId),
      role,
      isActive === 'inactive' ? false : true,
    );
  }

  @Post()
  addPlan(@Body() createPlansDto: CreatePlansDto) {
    return this.plansService.addPlan(createPlansDto);
  }
  @Get(':id')
  getPlan(@Param() params: any) {
    return this.plansService.getPlan(params.id);
  }

  @Patch(':id')
  updatePlan(@Param() params: any, @Body() updatePlansDto: UpdatePlansDto) {
    return this.plansService.updatePlan(params.id, updatePlansDto);
  }

  @Put('order')
  async updatePlansOrder(@Body() data: PlanOrderDTO) {
    return await this.plansService.updatePlansOrder(data);
  }

  @Delete(':id')
  async inactivePlan(
    @Param() params: IdParamsDTO,
    @Query('isActive') isActive: string,
  ) {
    return await this.plansService.inactivePlan(
      params.id,
      isActive === 'inactive' ? true : false,
    );
  }
}
