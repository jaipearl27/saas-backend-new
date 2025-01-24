import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plans } from 'src/schemas/Plans.schema';
import { CreatePlansDto } from './dto/createPlans.dto';
import { UpdatePlansDto } from './dto/updatePlans.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plans.name) private plansModel: Model<Plans>,
    private readonly configService: ConfigService,
  ) {}

  async getPlan(id: string): Promise<any> {
    const plans = await this.plansModel.findById(id);

    if (!plans) {
      throw new NotFoundException('No Plan found.');
    }

    return plans;
  }

  async getPlans(): Promise<any> {
    const plans = await this.plansModel.find();
    return plans;
  }

  async addPlan(createPlanDto: CreatePlansDto): Promise<any> {
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

  async updatePlan(id: string, updatePlanDto: UpdatePlansDto): Promise<any> {
    // Create the new plan
    const plan = this.plansModel.findByIdAndUpdate(id, updatePlanDto, {
      new: true,
    });
    return plan;
  }

  async deletePlan(id: string): Promise<any> {
    const plan = this.plansModel.findByIdAndDelete(id);
    return plan;
  }
}
