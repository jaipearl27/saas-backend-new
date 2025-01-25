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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlansService } from './plans.service';
import { CreatePlansDto, PlanOrderDTO } from './dto/createPlans.dto';
import { UpdatePlansDto } from './dto/updatePlans.dto';
import { Id, Role } from 'src/decorators/custom.decorator';
import { Types } from 'mongoose';

@Controller('plans')
export class PlansController {
  constructor(
    private readonly configService: ConfigService,
    private readonly plansService: PlansService,
  ) {}

  @Get()
  getPlans(@Id() userId: string, @Role() role: string) {
    if (!userId || !role) {
      throw new BadRequestException('User ID and Role is required');
    }
    return this.plansService.getPlans(new Types.ObjectId(userId), role);
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
  deletePlan(@Param() params: any) {
    return this.plansService.deletePlan(params.id);
  }
}
