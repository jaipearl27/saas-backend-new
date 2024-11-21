import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plans } from 'src/schemas/Plans.schema';
import { PlansDto } from './dto/plans.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plans.name) private plansModel: Model<Plans>,
    private readonly configService: ConfigService,
  ) {}

  async getPlans(): Promise<any> {
    const plans = await this.plansModel.find();
    return plans;
  }

  async addPlan(createPlanDto: PlansDto): Promise<any> {
    // Check if a plan with the same name already exists
    const existingPlan = await this.plansModel.findOne({
      $or: [{ name: createPlanDto.name }, { amount: createPlanDto.amount }],
    });
    if (existingPlan) {
      throw new BadRequestException(
        'A plan with the same name/amount already exists.',
      );
    }

    // Create the new plan
    const plan = new this.plansModel(createPlanDto);
    return await plan.save();
  }
}
