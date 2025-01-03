import { Injectable, NotFoundException, BadRequestException, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddOn } from '../schemas/addon.schema';
import { CreateAddOnDto } from './dto/addon.dto';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class AddOnService {
  constructor(
    @InjectModel(AddOn.name) private readonly addOnModel: Model<AddOn>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // Create AddOn
  async createAddOn(data: CreateAddOnDto) {
    const { admin, type, amount, startDate, expiryDate, addOnPrice } = data;

    const subscription = await this.subscriptionService.getSubscription(admin);
    if (!subscription) {
        throw new NotFoundException('Subscription not found');
    }

    if (new Date(subscription.expiryDate) < new Date()) {
      throw new NotAcceptableException('Subscription Expired');
    }

    if (!['employeeLimit', 'contactLimit'].includes(type)) {
      throw new BadRequestException('Invalid add-on type');
    }

    const addOn = new this.addOnModel({
      subscription: subscription._id,
      admin: new Types.ObjectId(`${admin}`),
      type,
      amount,
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      addOnPrice,
    });

     await addOn.save();

     if(!addOn) {
       throw new BadRequestException('Failed to create AddOn');
     }

    // TODO: update subscriptioin with addOn


  }

  // Get all AddOns
  async getAllAddOns(): Promise<AddOn[]> {
    return await this.addOnModel.find().populate('subscription admin').exec();
  }

  // Get AddOn by ID
  async getAddOnById(id: string): Promise<AddOn> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid AddOn ID');
    }

    const addOn = await this.addOnModel.findById(id).populate('subscription admin').exec();
    if (!addOn) {
      throw new NotFoundException('AddOn not found');
    }

    return addOn;
  }

  // Update AddOn
  async updateAddOn(id: string, updateData: Partial<AddOn>): Promise<AddOn> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid AddOn ID');
    }

    const updatedAddOn = await this.addOnModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!updatedAddOn) {
      throw new NotFoundException('AddOn not found');
    }

    return updatedAddOn;
  }

  // Delete AddOn
  async deleteAddOn(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid AddOn ID');
    }

    const result = await this.addOnModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('AddOn not found');
    }
  }
}
