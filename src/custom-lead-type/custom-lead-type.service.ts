import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomLeadType } from 'src/schemas/custom-lead-type.schema';
import { CustomLeadTypeDto } from './dto/custom-lead-type.dto';

@Injectable()
export class CustomLeadTypeService {
  constructor(
    @InjectModel(CustomLeadType.name)
    private readonly customLeadTypeModel: Model<CustomLeadType>,
  ) {}

  async createLeadType(
    data: CustomLeadTypeDto,
    adminId: string,
  ): Promise<CustomLeadType> {
    const newLeadType = new this.customLeadTypeModel({
      ...data,
      createdBy: new Types.ObjectId(`${adminId}`),
    });
    return await newLeadType.save();
  }

  async getLeadTypes(adminId: string): Promise<CustomLeadType[]> {
    return await this.customLeadTypeModel
      .find({ createdBy: new Types.ObjectId(`${adminId}`) })
      .exec();
  }

  async getLeadType(leadTypeId: string, adminId: string): Promise<CustomLeadType> {
    return await this.customLeadTypeModel
      .findOne({
        _id: new Types.ObjectId(`${leadTypeId}`),
        createdBy: new Types.ObjectId(`${adminId}`),
      })
      .exec();
  }

  async updateLeadType(
    leadTypeId: string,
    adminId: string,
    data: CustomLeadTypeDto,
  ) {
    console.log('leadTypeId', leadTypeId, adminId, data);
    return await this.customLeadTypeModel
      .findOneAndUpdate(
        { _id: leadTypeId, createdBy: new Types.ObjectId(`${adminId}`) },
        {
          $set: {
            label: data.label,
            color: data.color,
          },
        },
        { new: true },
      )
      .exec();
  }

  async deleteLeadType(leadTypeId: string, adminId: string) {
    return await this.customLeadTypeModel.findOneAndDelete({
      _id: new Types.ObjectId(`${leadTypeId}`),
      createdBy: new Types.ObjectId(`${adminId}`),
    });
  }
}
