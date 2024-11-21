import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlansService } from './plans.service';
import { PlansDto } from './dto/plans.dto';

@Controller('plans')
export class PlansController {
    constructor(
        private readonly configService: ConfigService,
        private readonly plansService: PlansService
    ){}

    @Get()
    getPlans(){
        return this.plansService.getPlans()
    }

    @Post()
    addPlan(@Body() plansDto: PlansDto){
        return this.plansService.addPlan(plansDto)
    }
}
