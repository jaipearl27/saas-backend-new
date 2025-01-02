import { Module } from '@nestjs/common';
import { AddonController } from './addon.controller';
import { AddOnService } from './addon.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AddOn, AddOnSchema } from 'src/schemas/addon.schema';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AddOn.name, schema: AddOnSchema }]),
    SubscriptionModule
  ],
  controllers: [AddonController],
  providers: [AddOnService,],
})
export class AddonModule {}
