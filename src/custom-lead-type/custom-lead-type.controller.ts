import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { CustomLeadTypeDto } from './dto/custom-lead-type.dto';
import { CustomLeadTypeService } from './custom-lead-type.service';

@Controller('custom-lead-type')
export class CustomLeadTypeController {
  constructor(private readonly customLeadTypeService: CustomLeadTypeService) {}

  @Post()
  async createLeadType(@Body() data: CustomLeadTypeDto, @Id() adminId: string) {
    return await this.customLeadTypeService.createLeadType(data, adminId);
  }

  @Get()
  async getLeadTypes(@AdminId() adminId: string) {
    return await this.customLeadTypeService.getLeadTypes(adminId);
  }

  @Patch(':leadTypeId')
  async updateLeadType(
    @Id() adminId: string,
    @Param('leadTypeId') leadTypeId: string,
    @Body() data: CustomLeadTypeDto,
  ) {
    return await this.customLeadTypeService.updateLeadType(
      leadTypeId,
      adminId,
      data,
    );
  }

     @Delete(':leadTypeId')
    async deleteLeadType(
        @Id() adminId: string,
        @Param('leadTypeId') leadTypeId: string,    
    ) {
        return await this.customLeadTypeService.deleteLeadType(leadTypeId, adminId);
    }
}
