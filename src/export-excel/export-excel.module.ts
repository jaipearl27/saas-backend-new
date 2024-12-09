import { Module } from '@nestjs/common';
import { ExportExcelController } from './export-excel.controller';
import { ExportExcelService } from './export-excel.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema },]), UsersModule],
  controllers: [ExportExcelController],
  providers: [ExportExcelService,],
})
export class ExportExcelModule {}
