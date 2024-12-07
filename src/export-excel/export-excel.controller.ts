import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ExportExcelService } from './export-excel.service';
import { Response } from 'express';
import * as fs from 'fs';
import { GetClientsFilterDto } from 'src/users/dto/filters.dto';

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
        filters
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
