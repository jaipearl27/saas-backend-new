// addon.service.ts
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddOn } from '../schemas/addon.schema';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/addon.dto';
import { SubscriptionAddonService } from 'src/subscription-addon/subscription-addon.service';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class AddOnService {
  constructor(
    @InjectModel(AddOn.name) private readonly addOnModel: Model<AddOn>,
    private readonly subscriptionAddonService: SubscriptionAddonService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async createAddOn(createAddOnDto: CreateAddOnDto): Promise<AddOn> {
    const addOn = new this.addOnModel(createAddOnDto);
    return addOn.save();
  }

  async getAddOns(): Promise<AddOn[]> {
    return this.addOnModel.find().exec();
  }

  async getAddOnById(id: string): Promise<AddOn> {
    const addOn = await this.addOnModel.findById(id).exec();
    if (!addOn) {
      throw new NotFoundException('AddOn not found');
    }
    return addOn;
  }

  async updateAddOn(
    id: string,
    updateAddOnDto: UpdateAddOnDto,
  ): Promise<AddOn> {
    const addOn = await this.addOnModel
      .findByIdAndUpdate(id, updateAddOnDto, {
        new: true,
      })
      .exec();
    if (!addOn) {
      throw new NotFoundException('AddOn not found');
    }
    return addOn;
  }

  async deleteAddOn(id: string): Promise<void> {
    const result = await this.addOnModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('AddOn not found');
    }
  }

  async getAdminAddons(adminId: string) {
    const subscription: any = await this.subscriptionService.getSubscription(adminId);
    if(!subscription) throw new NotFoundException('Subscription not found');
    return await this.subscriptionAddonService.getUserAddons( subscription._id);
  }
}
