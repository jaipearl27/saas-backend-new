import { Module } from '@nestjs/common';
import { BillingHistoryService } from './billing-history.service';
import { BillingHistoryController } from './billing-history.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BillingHistory,
  BillingHistorySchema,
} from 'src/schemas/BillingHistory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BillingHistory.name,
        schema: BillingHistorySchema,
      },
    ]),
  ],
  providers: [BillingHistoryService],
  controllers: [BillingHistoryController],
  exports: [BillingHistoryService],
})
export class BillingHistoryModule {}
