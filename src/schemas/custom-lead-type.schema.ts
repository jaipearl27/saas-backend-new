import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class CustomLeadType extends Document {
  @Prop({
    type: String,
    required: [true, 'Lead Type Name is required'],
  })
  label: string; // Status name

  @Prop({
    type: String,
    required: [true, 'Lead Type Color is required'],
  })
  color: string; // Status name

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'createdBy/UserId is required'],
  })
  createdBy: Types.ObjectId;

}

export const CustomLeadTypeSchema =
  SchemaFactory.createForClass(CustomLeadType);
