import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './User.schema';

export enum Usecase {
  EMPLOYEE_ASSIGNMENT = 'employee_assignment',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILURE = 'payment_failure',
  PRODUCT = 'product',
}

@Schema({ timestamps: true })
export class Tag extends Document {
  @Prop({
    type: String,
    maxlength: 100,
    trim: true,
    required: [true, 'Name is required'],
    lowercase: true,
  })
  name: string;

  @Prop({
    type: String,
    required: [true, 'usecase is required'],
    enum: Object.values(Usecase),
  })
  usecase: Usecase;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: [true, 'adminId is required'],
  })
  adminId: Types.ObjectId;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

TagSchema.index({ adminId: 1 });
