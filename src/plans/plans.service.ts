import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Plans, PlanType } from 'src/schemas/Plans.schema';
import { CreatePlansDto, PlanOrderDTO } from './dto/createPlans.dto';
import { UpdatePlansDto } from './dto/updatePlans.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plans.name) private plansModel: Model<Plans>,
    private readonly configService: ConfigService,
  ) {}

  async getPlan(id: string): Promise<Plans> {
    const plans = await this.plansModel.findById(id);

    if (!plans) {
      throw new NotFoundException('No Plan found.');
    }

    return plans;
  }

  async getPlans(userId: Types.ObjectId, role: string): Promise<any> {
    let query = {};

    if (role !== this.configService.get('appRoles')['SUPER_ADMIN']) {
      query = {
        isActive: true,
        $or: [
          { planType: PlanType.NORMAL },
          { assignedUsers: { $in: [userId] } },
        ],
      };
    }
    const plans = await this.plansModel.find(query).sort({ sortOrder: 1 });
    return plans;
  }

  async addPlan(createPlanDto: CreatePlansDto): Promise<any> {
    const existingPlan = await this.plansModel.findOne({ internalName: createPlanDto.internalName });

    if (existingPlan) {
      throw new BadRequestException(
        'A plan with the same Internal Name already exists.',
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

  async updatePlansOrder(data: PlanOrderDTO): Promise<any> {
    const { plans } = data;

    const ids = plans.map((plan) => plan.id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Duplicate IDs in the input data.');
    }

    const updatePromises = plans.map(async (plan) => {
      return this.plansModel.updateOne(
        { _id: plan.id },
        { $set: { sortOrder: plan.sortOrder } },
      );
    });

    await Promise.all(updatePromises);

    return {
      message: 'Plans order updated successfully.',
      updatedPlans: plans,
    };
  }
}
