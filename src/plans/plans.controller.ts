import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlansService } from './plans.service';
import { CreatePlansDto } from './dto/createPlans.dto';
import { UpdatePlansDto } from './dto/updatePlans.dto';

@Controller('plans')
export class PlansController {
  constructor(
    private readonly configService: ConfigService,
    private readonly plansService: PlansService,
  ) {}

  @Get()
  getPlans() {
    return this.plansService.getPlans();
  }

  @Post()
  addPlan(@Body() createPlansDto: CreatePlansDto) {
    return this.plansService.addPlan(createPlansDto);
  }
  @Patch(':id')
  updatePlan(@Param() params: any, @Body() updatePlansDto: UpdatePlansDto) {
    return this.plansService.updatePlan(params.id, updatePlansDto);
  }

  @Delete(':id')
  deletePlan(@Param() params: any) {
    return this.plansService.deletePlan(params.id);
  }
}
