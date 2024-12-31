import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotAcceptableException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { WebinarService } from './webinar.service';
import { CreateWebinarDto, UpdateWebinarDto } from './dto/createWebinar.dto';
import { WebinarFilterDTO } from './dto/webinar-filter.dto';
import { UsersService } from 'src/users/users.service';
@Controller('webinar')
export class WebinarController {
  constructor(
    private readonly webinarService: WebinarService,
    private readonly usersService: UsersService,
  ) {}

  @Post('data')
  async getWebinars(
    @Id() adminId: string,
    @Query() query: { page: string; limit: string },
    @Body() body: { filters: WebinarFilterDTO },
  ): Promise<any> {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;

    const result = await this.webinarService.getWebinars(
      adminId,
      page,
      limit,
      body.filters,
    );
    return result;
  }

  @Get()
  async getEmployeeWebinars(
    @AdminId() adminId: string,
    @Id() id: string,
    @Query('employeeId') employeeId: string | undefined,
  ): Promise<any> {
    if (employeeId) {
      const employee = await this.usersService.getEmployee(employeeId);

      if (!employee || employee.adminId.toString() !== id.toString()) {
        throw new BadRequestException(
          'You are not authorized to access this resource.',
        );
      }
    }

    if (!id || !adminId) {
      throw new NotAcceptableException('Invalid request');
    }
    return await this.webinarService.getEmployeeWebinars(employeeId|| id, adminId);
  }

  @Post()
  async createWebinar(
    @Id() adminId: string,
    @Body() createWebinarDto: CreateWebinarDto,
  ): Promise<any> {
    createWebinarDto.adminId = adminId;
    const result = await this.webinarService.createWebiar(createWebinarDto);
    return result;
  }

  @Patch(':id')
  async updateWebinar(
    @Id() adminId: string,
    @Param('id') id: string,
    @Body() updateWebinarDto: UpdateWebinarDto,
  ): Promise<any> {
    const result = await this.webinarService.updateWebinar(
      id,
      adminId,
      updateWebinarDto,
    );
    return result;
  }

  @Delete(':id')
  async deleteWebinar(
    @Id() adminId: string,
    @Param('id') id: string,
  ): Promise<any> {
    const result = await this.webinarService.deleteWebinar(id, adminId);
    return result;
  }

  @Get('employee/:id')
  async getAssignedEmployees(@Param('id') webinarId: string) {
    return await this.webinarService.getAssignedEmployees(webinarId);
  }
}
