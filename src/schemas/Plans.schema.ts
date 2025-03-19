import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { User } from './User.schema';

export enum PlanDuration {
  ONE_MONTH = 30,
  QUARTER = 90,
  HALF_YEAR = 180,
  ONE_YEAR = 365,
}

export enum PlanType {
  CUSTOM = 'custom',
  NORMAL = 'normal',
}

export type PlanDurationConfig = {
  duration: number;
  discountType: string;
  discountValue: number;
};

@Schema({ timestamps: true })

export class Plans extends Document {
  @Prop({
    type: String,
    required: [true, 'Plan Name is required'],
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    unique: true,
    trim: true,
    required: [true, 'Plan Name is required'],
  })
  internalName: string;

  @Prop({
    type: Number,
    min: 1,
    required: [true, 'Plan Amount is required'],
  })
  amount: number; //plan amount

  @Prop({
    type: Number,
    min: 1,
    required: [true, 'Employee Count is required'],
  })
  employeeCount: number; //Employee Count

  @Prop({
    type: Number,
    min: 1,
    required: [true, 'Contact Limit is required'],
  })
  contactLimit: number;

  @Prop({
    type: Number,
    min: 0,
    default: 0,
    required: [true, 'Toggle Limit is required'],
  })
  toggleLimit: number; //Plan duration

  @Prop({ type: Map, of: MongooseSchema.Types.Mixed, required: true })
  attendeeTableConfig: Map<string, any>;

  @Prop({
    type: String,
    default: PlanType.NORMAL,
  })
  planType: PlanType;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
    required: false,
  })
  assignedUsers: Types.ObjectId[];

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  sortOrder: number;

  @Prop({ type: Boolean, default: false })
  whatsappNotificationOnAlarms: boolean;

  @Prop({ type: Boolean, default: false })
  employeeInactivity: boolean;

  @Prop({ type: Boolean, default: false })
  employeeRealTimeStatusUpdate: boolean;

  @Prop({ type: Boolean, default: false })
  calendarFeatures: boolean;

  @Prop({ type: Boolean, default: false })
  setAlarm: boolean;

  @Prop({ type: Boolean, default: false })
  productRevenueMetrics: boolean;

  @Prop({ type: Boolean, default: false })
  renewalNotAllowed: boolean;

  @Prop({ type: Boolean, default: false })
  assignmentMetrics: boolean;

  @Prop({ type: String, default: '' })
  customRibbon: string;

  @Prop({ type: String, default: '' })
  customRibbonColor: string;

  @Prop({
    type: Map,
    of: new mongoose.Schema({
      duration: { type: Number, required: true },
      discountType: {
        type: String,
        enum: ['flat', 'percent'],
        required: true,
      },
      discountValue: {
        type: Number,
        required: true,
        min: 0,
      },
    }),
    required: true,
  })
  planDurationConfig: Map<
    string,
    PlanDurationConfig
  >;

  static async validatePlanDurationConfig(this: Plans) {
    const requiredDurations = ['monthly', 'quarterly', 'halfyearly', 'yearly', 'custom'];
    const durationDays = {
      monthly: 30,
      quarterly: 90,
      halfyearly: 180,
      yearly: 365,
    };

    for (const key of requiredDurations) {
      if (!this.planDurationConfig.has(key)) {
        continue;
      }

      const durationConfig = this.planDurationConfig.get(key);

      if (durationConfig.duration !== durationDays[key] && key !== 'custom') {
        throw new Error(
          `The "${key}" duration must be ${durationDays[key]} days.`,
        );
      }

      const { discountType, discountValue } = durationConfig;

      if (discountType === 'percent' && discountValue > 100) {
        throw new Error(
          `The discount value for "${key}" cannot exceed 100% if the discount type is "percent".`,
        );
      }

      if (discountType === 'flat' && discountValue > this.amount) {
        throw new Error(
          `The discount value for "${key}" cannot exceed the plan amount (${this.amount}) if the discount type is "flat".`,
        );
      }

      if (discountType !== 'flat' && discountType !== 'percent') {
        throw new Error(
          `The discount type for "${key}" must be either "flat" or "percent".`,
        );
      }
    }
  }
}

export const PlansSchema = SchemaFactory.createForClass(Plans);

PlansSchema.pre('save', async function (next) {
  try {
    await Plans.validatePlanDurationConfig.call(this);
    next();
  } catch (err) {
    next(err);
  }
});

PlansSchema.index({ name: 1 });

PlansSchema.index({ amount: 1 });
 