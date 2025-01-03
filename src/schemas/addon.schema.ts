// addon.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AddOn extends Document {
  @Prop({ type: Number, min: 0, required: true })
  employeeLimit: number;

  @Prop({ type: Number, min: 0, required: true })
  contactLimit: number;

  @Prop({ type: Number, min: 0, required: true })
  addOnPrice: number;

  @Prop({ type: Number, min: 1, required: true })
  validityInDays: number;

  @Prop({ type: Boolean, required: true, default: true })
  isActive: boolean;
}

export const AddOnSchema = SchemaFactory.createForClass(AddOn);