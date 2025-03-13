import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Subscription } from './Subscription.schema';
import { AddOn } from './addon.schema';

@Schema({ timestamps: true })
export class SubscriptionAddOn extends Document {
  @Prop({ type: Types.ObjectId, ref: Subscription.name, required: true })
  subscription: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: AddOn.name, required: true })
  addOn: Types.ObjectId;

  @Prop({ type: Date, required: true })
  expiryDate: Date;

  @Prop({ type: Number, min: 0, default: 0 })
  employeeLimit: number;

  @Prop({ type: Number, min: 0, default: 0 })
  contactLimit: number;
}

const SubscriptionAddOnSchema = SchemaFactory.createForClass(SubscriptionAddOn);

SubscriptionAddOnSchema.index({ subscription: 1 });
SubscriptionAddOnSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });
export { SubscriptionAddOnSchema };
