import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { User } from './User.schema';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  admin: Types.ObjectId; // Admin user

  @Prop({
    type: Types.ObjectId,
    ref: 'Plans',
    required: true,
  })
  plan: Types.ObjectId; // Linked plan

  @Prop({
    type: Date,
    default: Date.now,
    required: true,
  })
  startDate: Date;

  @Prop({
    type: Number,
    required: [true, 'Contact limit is required'],
  })
  contactLimit: number;

  @Prop({
    type: Number,
    required: [true, 'Contact limit is required'],
  })
  employeeLimit: number;

  @Prop({ type: Date, required: true })
  expiryDate: Date; // Calculated based on the plan duration

  @Prop({
    type: Number,
    min: 0,
    default: 0,
    required: [true, 'Toggle Limit is required'],
  })
  toggleLimit: number; //Plan duration

  @Prop({
    type: Number,
    min: 0,
    default: 0,
    required: false,
  })
  employeeLimitAddon: number; // Employee limit add-on

  @Prop({
    type: Number,
    min: 0,
    default: 0,
    required: false,
  })
  contactLimitAddon: number; // Employee limit add-on
}

const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Add pre-save middleware to transform `admin` and `plan` to ObjectId
SubscriptionSchema.pre('save', function (next) {
  if (typeof this.admin === 'string') {
    this.admin = new Types.ObjectId(`${this.admin}`);
  }
  if (typeof this.plan === 'string') {
    this.plan = new Types.ObjectId(`${this.plan}`);
  }
  next();
});

// Attach the instance method to the schema
SubscriptionSchema.methods.isExpired = function (): boolean {
  const now = new Date();
  return this.expiryDate < now;
};

export { SubscriptionSchema };
