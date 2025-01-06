import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/addon.dto';
import { AddOnService } from './addon.service';
import { AddOn } from 'src/schemas/addon.schema';

@Controller('addon')
export class AddonController {
  constructor(private readonly addOnService: AddOnService) {}

  @Post()
  async createAddOn(@Body() createAddOnDto: CreateAddOnDto): Promise<AddOn> {
    return this.addOnService.createAddOn(createAddOnDto);
  }

  @Get()
  async getAddOns(): Promise<AddOn[]> {
    return this.addOnService.getAddOns();
  }

  @Get('client/:id')
  async getAddOnById(@Param('id') id: string) {
    return await this.addOnService.getAdminAddons(id);
  }

  @Put(':id')
  async updateAddOn(
    @Param('id') id: string,
    @Body() updateAddOnDto: UpdateAddOnDto,
  ): Promise<AddOn> {
    return this.addOnService.updateAddOn(id, updateAddOnDto);
  }
}
