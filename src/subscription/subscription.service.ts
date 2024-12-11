import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription } from 'src/schemas/Subscription.schema';
import { SubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectModel(Subscription.name) private SubscriptionModel: Model<Subscription>,
    ){}

    async addSubscription(subscriptionDto: SubscriptionDto): Promise<any> {
        const result = await this.SubscriptionModel.create(subscriptionDto)
        return result
    }

    async updateSubscription(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<any> {
        const result = await this.SubscriptionModel.findByIdAndUpdate(id, updateSubscriptionDto)

        return result
    }

    async getSubscription(adminId: string): Promise<any> {
        const result = await this.SubscriptionModel.findOne({admin: new Types.ObjectId(adminId)})
        .populate('plan');
        return result
    }


}
