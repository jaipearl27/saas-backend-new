import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Subscription } from './Subscription.schema';
import { User } from './User.schema';

@Schema({ timestamps: true })
export class AddOn extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  admin: Types.ObjectId; // Admin user

  @Prop({ type: Types.ObjectId, ref: Subscription.name, required: true })
  subscription: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['employeeLimit', 'contactLimit'],
    required: true,
  })
  type: string;

  @Prop({ type: Number, min: 1, required: true })
  amount: number;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  expiryDate: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, min: 0, required: true })
  addOnPrice: number;
}

export const AddOnSchema = SchemaFactory.createForClass(AddOn);

AddOnSchema.index({ subscription: 1, type: 1 }, { unique: true });
