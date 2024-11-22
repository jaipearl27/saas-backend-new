import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription } from 'src/schemas/Subscription.schema';

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectModel(Subscription.name) private SubscriptionModel: Model<Subscription>,
        private readonly configService: ConfigService
    ){}
}
