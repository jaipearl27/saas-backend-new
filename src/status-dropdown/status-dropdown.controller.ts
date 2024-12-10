import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { StatusDropdownService } from './status-dropdown.service';
import { AdminId, Id, Role } from 'src/decorators/custom.decorator';

@Controller('status-dropdown')
export class StatusDropdownController {
  constructor(private readonly statusDropdownService: StatusDropdownService) {}

  // Create a new status
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: { label: string; isDefault: boolean },
    @Id() id: string,
    @Role() role: string,
  ) {
    if (!body.label) throw new Error('Please enter a label');
    return await this.statusDropdownService.create(body.label, id, role);
  }

  @Get()
  async findAll(
    @Id() id: string,
    @Role() role: string,
    @AdminId() adminId: string,
  ) {
    return await this.statusDropdownService.findAll(role, id, adminId);
  }

  // Update a status by ID
  // @Put(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Body() updateStatusDto: UpdateStatusDto,
  // ) {
  //   return await this.statusDropdownService.update(id, updateStatusDto);
  // }

  // Delete a status by ID
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Id() userId: string,
    @Role() role: string,
  ) {
    return await this.statusDropdownService.remove(id, userId, role);
  }
}
