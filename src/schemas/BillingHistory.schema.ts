import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Plans } from './Plans.schema';
import { User } from './User.schema';
import { AddOn } from './addon.schema';

export enum DurationType {
  ONE_MONTH = 'monthly',
  QUARTER = 'quarterly',
  HALF_YEAR = 'halfyearly',
  ONE_YEAR = 'yearly',
}

export const monthMultiplier = {
  monthly: 1,
  quarterly: 3,
  halfyearly: 6,
  yearly: 12,
};

export enum BillingType {
  NEW_PLAN = 'new_plan',
  ADD_ON = 'add_on',
  RENEWAL = 'renewal',
}

@Schema({ timestamps: true })

export class BillingHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })

  admin: Types.ObjectId; // Admin user

  @Prop({
    type: Date,
    default: Date.now(),
  })
  date: Date;

  @Prop({
    type: Types.ObjectId,
    ref: Plans.name,
    required: false,
  })
  plan?: Types.ObjectId | null;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  itemAmount: number;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  discountAmount: number;

  @Prop({
    type: String,
    default: null,
  })
  durationType: DurationType | null;

  @Prop({
    type: String,
    enum: BillingType,
    required: true,
  })
  billingType: BillingType;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  taxPercent: number;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  taxAmount: number;

  @Prop({
    type: Number,
    required: [true, 'Billing amount is required'],
    min: 0,
  })
  amount: number;

  @Prop({
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
  })
  invoiceNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: AddOn.name,
    required: false,
  })
  addOn?: Types.ObjectId | null;
}

const BillingHistorySchema = SchemaFactory.createForClass(BillingHistory);

BillingHistorySchema.index({ date: 1 });
BillingHistorySchema.index({ admin: 1, date: 1 });
BillingHistorySchema.index({ invoiceNumber: 1 }, { unique: true });

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
