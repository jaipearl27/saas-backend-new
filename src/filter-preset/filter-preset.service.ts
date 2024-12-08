import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FilterPreset } from '../schemas/FilterPreset.schema';
import { CreateFilterPresetDto } from './dto/create-filter-preset.dto';

@Injectable()
export class FilterPresetService {
  constructor(
    @InjectModel(FilterPreset.name) private filterPresetModel: Model<FilterPreset>,
  ) {}

  // Create a new filter preset
  async create(createFilterPresetDto: CreateFilterPresetDto, userId: string): Promise<FilterPreset> {
    const createdFilterPreset = new this.filterPresetModel({
      ...createFilterPresetDto,
      userId,
    });
    return createdFilterPreset.save();
  }

  // Get all filter presets for a user
  async findAll(userId: string): Promise<FilterPreset[]> {
    return this.filterPresetModel.find({ userId }).exec();
  }

    // Get all filter presets for a user
    async findByTableName(userId: string, tableName: string): Promise<FilterPreset[]> {
      return this.filterPresetModel.find({ userId, tableName }).exec();
    }

  // Get a specific filter preset by ID
  async findOne(id: string): Promise<FilterPreset> {
    return this.filterPresetModel.findById(id).exec();
  }

  // Delete a filter preset by ID
  async remove(id: string, userId: string): Promise<void> {
    const filterPreset = await this.filterPresetModel.findById(id).exec();

    if (!filterPreset || filterPreset.userId.toString() !== userId) {
      throw new Error('Filter preset not found or you do not have permission to delete it.');
    }

    await this.filterPresetModel.findByIdAndDelete(id).exec();
  }
}
