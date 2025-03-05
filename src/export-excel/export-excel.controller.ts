import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ExportExcelService } from './export-excel.service';
import { Response } from 'express';
import * as fs from 'fs';
import { GetClientsFilterDto } from 'src/users/dto/filters.dto';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { ExportWebinarAttendeesDTO } from 'src/attendees/dto/attendees.dto';
import { WebinarFilterDTO } from 'src/webinar/dto/webinar-filter.dto';
import { EmployeeFilterDTO } from 'src/users/dto/employee-filter.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('export-excel')
export class ExportExcelController {
  constructor(private readonly exportExcelService: ExportExcelService) {}

  @Get('/user-documents')
  async getUserDocuments(
    @Id() userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    if (!userId)
      throw new BadRequestException(
        'User ID is required to fetch user documents.',
      );

    return await this.exportExcelService.getUserDocuments(
      userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 10000 } })
  @Get('/user-documents/:id')
  async getUserDocument(
    @Id() userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    if (!userId || !id)
      throw new BadRequestException(
        'User ID and Document ID are required to fetch user documents.',
      );

    const userDocument = await this.exportExcelService.getUserDocument(
      userId,
      id,
    );
    if (!userDocument)
      throw new BadRequestException('User document not found.');

    const filePath = userDocument.filePath;
    // check if file exists
    if (!fs.existsSync(filePath))
      throw new BadRequestException('File not found.');

    // Stream the file to the client
    res.setHeader('Content-Disposition', `attachment; filename="users.xlsx"`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Delete('/user-documents/:id')
  async deleteUserDocument(
    @Id() userId: string,
    @Param('id') id: string,
  ) {
    if (!userId || !id)
      throw new BadRequestException(
        'User ID and Document ID are required to fetch user documents.',
      );

    return await this.exportExcelService.deleteUserDocument(userId, id);
  }

  @Post('/client')
  async downloadExcel(
    @Body() filters: GetClientsFilterDto,
    @Query('limit') limit: string,
    @Query('columns') columns: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filePath = await this.exportExcelService.generateExcelForClients(
        parseInt(limit) || 1000,
        columns ? columns.split(',') : [],
        filters,
      );

      // Stream the file to the client
      res.setHeader('Content-Disposition', `attachment; filename="users.xlsx"`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      const fileStream = fs.createReadStream(filePath.filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to download Excel file. Please try again later.',
        error: error.message,
      });
    }
  }

  @Post('/webinar-attendees')
  async downloadWebinarAttendees(
    @Body()
    body: ExportWebinarAttendeesDTO,
    @Id() adminId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filePath =
        await this.exportExcelService.generateExcelForWebinarAttendees(
          body.limit,
          body.columns,
          body.filters,
          body.webinarId,
          body.isAttended,
          adminId,
          body?.validCall,
          body?.assignmentType,
        );

      // Stream the file to the client
      res.setHeader('Content-Disposition', `attachment; filename="users.xlsx"`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      const fileStream = fs.createReadStream(filePath.filePath);
      fileStream.pipe(res);

      // Delete the file after streaming
      fileStream.on('end', () => {
        // fs.unlinkSync(filePath);'
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to download Excel file. Please try again later.',
        error: error.message,
      });
    }
  }

  @Post('/webinars')
  async downloadWebinars(
    @Body()
    body: { filters: WebinarFilterDTO; columns: string[]; fieldName: string },
    @Id() adminId: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!adminId)
        throw new BadRequestException(
          'Admin ID is required to download webinars Excel file.',
        );
      const filePath = await this.exportExcelService.generateExcelForWebinar(
        parseInt(limit) || 100,
        body.columns,
        body.filters,
        adminId,
      );

      // Stream the file to the client
      res.setHeader('Content-Disposition', `attachment; filename="users.xlsx"`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      const fileStream = fs.createReadStream(filePath.filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to download Excel file. Please try again later.',
        error: error.message,
      });
    }
  }

  @Post('/employees')
  async downloadEmployees(
    @Body()
    body: { filters: EmployeeFilterDTO; columns: string[]; fieldName: string },
    @Id() adminId: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!adminId)
        throw new BadRequestException(
          'Admin ID is required to download Employees Excel file.',
        );
      const filePath = await this.exportExcelService.generateExcelForEmployees(
        parseInt(limit) || 100,
        body.columns,
        body.filters,
        adminId,
      );

      // Stream the file to the client
      res.setHeader('Content-Disposition', `attachment; filename="users.xlsx"`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      const fileStream = fs.createReadStream(filePath.filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to download Excel file. Please try again later.',
        error: error.message,
      });
    }
  }
}
