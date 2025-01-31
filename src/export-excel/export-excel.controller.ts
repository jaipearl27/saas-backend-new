import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ExportExcelService } from './export-excel.service';
import { Response } from 'express';
import * as fs from 'fs';
import { GetClientsFilterDto } from 'src/users/dto/filters.dto';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { ExportWebinarAttendeesDTO } from 'src/attendees/dto/attendees.dto';
import { WebinarFilterDTO } from 'src/webinar/dto/webinar-filter.dto';
import { EmployeeFilterDTO } from 'src/users/dto/employee-filter.dto';

@Controller('export-excel')
export class ExportExcelController {
  constructor(private readonly exportExcelService: ExportExcelService) {}

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

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Delete the file after streaming
      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
      });
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
      console.log('body', body, adminId);

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

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Delete the file after streaming
      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
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

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Delete the file after streaming
      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
      });
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

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Delete the file after streaming
      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to download Excel file. Please try again later.',
        error: error.message,
      });
    }
  }
}
