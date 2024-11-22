import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BillingHistory extends Document {
  @Prop({
    type: Date,
    default: Date.now(),
  })
  date: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'plans',
    required: [true, 'Plans id is required'],
  })
  plan: Types.ObjectId;

  @Prop({
    type: Number,
    required: [true, 'Billing amount is required'],
  })
  amount: number;
}
