import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BillingHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  admin: Types.ObjectId; // Admin user

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

const BillingHistorySchema = SchemaFactory.createForClass(BillingHistory);

// Add pre-save middleware to transform `admin` and `plan` to ObjectId
BillingHistorySchema.pre('save', function (next) {
  if (typeof this.admin === 'string') {
    this.admin = new Types.ObjectId(`${this.admin}`);
  }
  if (typeof this.plan === 'string') {
    this.plan = new Types.ObjectId(`${this.plan}`);
  }
  next();
});

export { BillingHistorySchema };
