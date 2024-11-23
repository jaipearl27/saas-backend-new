import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BillingHistory } from 'src/schemas/BillingHistory.schema';
import { BillingHistoryDto, UpdateBillingHistory } from './dto/bililngHistory.dto';

@Injectable()
export class BillingHistoryService {
    constructor(
        @InjectModel(BillingHistory.name) private BillingHistoryModel: Model<BillingHistory>
    ){}

    async addBillingHistory(billingHistoryDto: BillingHistoryDto): Promise<any> {
        const result = await this.BillingHistoryModel.create(billingHistoryDto)
        return result
    }

    async updateBillingHistory(id: string, updateBillingHistory: UpdateBillingHistory): Promise<any> {
        const result = this.BillingHistoryModel.findByIdAndUpdate(updateBillingHistory)
    }


}
