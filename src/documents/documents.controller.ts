import { Controller, Get, Param, Res } from '@nestjs/common';
import { join } from 'path';

@Controller('documents')
export class DocumentsController {
  @Get(':fileName')
  getDocument(@Param('fileName') fileName: string, @Res() res) {
    const filePath = join(__dirname, '../../documents', fileName); // Adjust path as needed
    return res.sendFile(filePath);
  }
}
