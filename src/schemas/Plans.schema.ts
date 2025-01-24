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

@Schema({ timestamps: true })
export class Plans extends Document {
  @Prop({
    type: String,
    unique: true,
    required: [true, 'Plan Name is required'],
  })
  name: string; //plan name

  @Prop({
    type: Number,
    min: 1,
    unique: true,
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
}

export const PlansSchema = SchemaFactory.createForClass(Plans);

// Create unique index on name
PlansSchema.index({ name: 1 }, { unique: true });

// Create unique index on amount
PlansSchema.index({ amount: 1 }, { unique: true });
