import { Module } from '@nestjs/common';
import { ExportExcelController } from './export-excel.controller';
import { ExportExcelService } from './export-excel.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [ExportExcelController],
  providers: [ExportExcelService],
})
export class ExportExcelModule {}
