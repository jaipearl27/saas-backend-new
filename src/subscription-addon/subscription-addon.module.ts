import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionAddonService } from './subscription-addon.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionAddOn, SubscriptionAddOnSchema } from 'src/schemas/SubscriptionAddon.schema';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionAddOn.name, schema: SubscriptionAddOnSchema },
    ]),
    forwardRef(() => SubscriptionModule),
  ],  
  providers: [SubscriptionAddonService],
  exports: [SubscriptionAddonService]
})
export class SubscriptionAddonModule {}
