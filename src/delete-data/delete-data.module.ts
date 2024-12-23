import { Module } from '@nestjs/common';
import { DeleteDataController } from './delete-data.controller';
import { DeleteDataService } from './delete-data.service';

@Module({
  controllers: [DeleteDataController],
  providers: [DeleteDataService]
})
export class DeleteDataModule {}
