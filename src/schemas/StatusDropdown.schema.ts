import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class StatusDropdown extends Document {
  @Prop({
    type: String,
    required: [true, 'Status Name is required'],
  })
  label: string; // Status name

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'createdBy/UserId is required'],
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: false,
  })
  isWorked: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDefault: boolean;
}

export const StatusDropdownSchema =
  SchemaFactory.createForClass(StatusDropdown);
