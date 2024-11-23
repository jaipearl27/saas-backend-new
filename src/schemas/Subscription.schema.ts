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

  @Prop({
    type: Number,
    required: [true, 'Contact limit is required']
  })
  contactLimit: number

  @Prop({ type: Date, required: true })
  expiryDate: Date; // Calculated based on the plan duration
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

export { SubscriptionSchema };
