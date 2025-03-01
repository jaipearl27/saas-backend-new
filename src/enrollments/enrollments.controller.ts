import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import {
  CreateEnrollmentDto,
  EnrollmentsByLevelOrProductDTO,
  GetEnrollmentsByProductLevelDto,
  UpdateEnrollmentDto,
} from './dto/enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  async createEnrollment(
    @AdminId() adminId: string,
    @Body() createEnrollmentDto: CreateEnrollmentDto,
  ): Promise<any> {
    createEnrollmentDto.adminId = adminId;
    const enrollment =
      await this.enrollmentsService.createEnrollment(createEnrollmentDto);
    return enrollment;
  }

  @Get('webinar/:id')
  async getEnrollment(
    @Param('id') webinarId: string,
    @Query() query: { page?: string; limit?: string },
    @AdminId() adminId: string,
  ): Promise<any> {
    const page = Number(query.page) ? Number(query.page) : 1;
    const limit = Number(query.limit) ? Number(query.limit) : 25;
    const enrollment = await this.enrollmentsService.getEnrollment(
      adminId,
      webinarId,
      page,
      limit,
    );

    return enrollment;
  }

  @Get('attendee/:id')
  async getAttendeeEnrollments(
    @Param('id') attendeeId: string,
    @Query() query: { page?: string; limit?: string },
    @AdminId() adminId: string,
  ): Promise<any> {
    const page = Number(query.page) ? Number(query.page) : 1;

    const limit = Number(query.limit) ? Number(query.limit) : 25;
    const enrollment = await this.enrollmentsService.getAttendeeEnrollments(
      adminId,
      attendeeId,
      page,
      limit,
    );

    return enrollment;
  }

  @Get('product-level-counts')
  async getProductLevelCounts(
    @AdminId() adminId: string,
    @Query('email') email: string,
  ): Promise<any> {
    if (!email || !adminId) {
      throw new BadRequestException('Email and Admin ID are required');
    }
    const result = await this.enrollmentsService.getProductLevelCounts(
      adminId,
      email,
    );
    return result;
  }

  @Get('product-level-enrollments')
  async getEnrollmentsByProductLevel(
    @AdminId() adminId: string,
    @Query() query: GetEnrollmentsByProductLevelDto,
  ): Promise<any> {
    const productLevel = Number(query.productLevel);
    if (isNaN(productLevel)) {
      throw new BadRequestException('Invalid product level');
    }

    const result = await this.enrollmentsService.getEnrollmentsByProductLevel(
      adminId,
      query.email,
      productLevel,
    );
    return result;
  }

  @Get('level-or-product')
  async getEnrollmentsByLevelOrProduct(
    @AdminId() adminId: string,
    @Query() query: EnrollmentsByLevelOrProductDTO,
  ): Promise<any> {
    return await this.enrollmentsService.getEnrollmentsByLevelOrProduct(
      query,
      adminId,
    );
  }

  @Patch(':id')
  async updateEnrollment(
    @Param('id') id: string,
    @AdminId() adminId: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<any> {
    const enrollment = await this.enrollmentsService.updateEnrollment(
      id,
      String(adminId),
      updateEnrollmentDto,
    );
    return enrollment;
  }
}
