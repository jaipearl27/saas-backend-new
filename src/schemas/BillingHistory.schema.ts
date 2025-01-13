import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Plans } from './Plans.schema';
import { User } from './User.schema';
import { AddOn } from './addon.schema';

@Schema({ timestamps: true })
export class BillingHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name
    , required: true })
  admin: Types.ObjectId; // Admin user

  @Prop({
    type: Date,
    default: Date.now(),
  })
  date: Date;

  @Prop({
    type: Types.ObjectId,
    ref: Plans.name,
    required: false
  })
  plan ?: Types.ObjectId | null;

  @Prop({
    type: Number,
    required: [true, 'Billing amount is required'],
  })
  amount: number;

  @Prop({
    type: Types.ObjectId,
    ref: AddOn.name,
    required: false
  })
  addOn ?: Types.ObjectId | null;
}

const BillingHistorySchema = SchemaFactory.createForClass(BillingHistory);

BillingHistorySchema.index({ admin: 1, date: 1 }, { unique: true });

// Add pre-save middleware to transform `admin` and `plan` to ObjectId
BillingHistorySchema.pre('save', function (next) {
  if (typeof this.admin === 'string') {
    this.admin = new Types.ObjectId(`${this.admin}`);
  }
  if (typeof this.plan === 'string') {
    this.plan = new Types.ObjectId(`${this.plan}`);
  }
  if (typeof this.addOn === 'string') {
    this.addOn = new Types.ObjectId(`${this.addOn}`);
  }
  next();
});

export { BillingHistorySchema };
