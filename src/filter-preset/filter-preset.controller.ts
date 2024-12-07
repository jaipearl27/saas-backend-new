import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { FilterPresetService } from './filter-preset.service';
import { CreateFilterPresetDto } from './dto/create-filter-preset.dto';
import { FilterPreset } from '../schemas/FilterPreset.schema';

@Controller('filter-presets')
export class FilterPresetController {
  constructor(private readonly filterPresetService: FilterPresetService) {}

  // Create a new filter preset
  @Post()
  async create(@Body() createFilterPresetDto: CreateFilterPresetDto): Promise<FilterPreset> {
    return this.filterPresetService.create(createFilterPresetDto);
  }

  // Get all filter presets for a user
  @Get('user/:userId')
  async findAll(@Param('userId') userId: string): Promise<FilterPreset[]> {
    return this.filterPresetService.findAll(userId);
  }

  // Get a specific filter preset by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FilterPreset> {
    return this.filterPresetService.findOne(id);
  }

  // Delete a filter preset by ID
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.filterPresetService.remove(id);
  }
}
