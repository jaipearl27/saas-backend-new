// addon.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddOn } from '../schemas/addon.schema';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/addon.dto';

@Injectable()
export class AddOnService {
  constructor(@InjectModel(AddOn.name) private readonly addOnModel: Model<AddOn>) {}

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

  async updateAddOn(id: string, updateAddOnDto: UpdateAddOnDto): Promise<AddOn> {
    const addOn = await this.addOnModel.findByIdAndUpdate(id, updateAddOnDto, {
      new: true,
    }).exec();
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
}
