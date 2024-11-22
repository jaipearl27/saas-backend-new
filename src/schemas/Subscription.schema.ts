import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  admin: Types.ObjectId; // Admin user

  @Prop({
    type: Types.ObjectId,
    ref: 'Plan',
    required: true,
  })
  plan: Types.ObjectId; // Linked plan

  @Prop({
    type: Date,
    default: Date.now,
    required: true,
  })
  startDate: Date;

  @Prop({ type: Date, required: true })
  expiryDate: Date; // Calculated based on the plan duration

  @Prop([{ type: Types.ObjectId, ref: 'billingHisotry' }])
  billingHistory: string[]; // Billing and upgrade history
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
