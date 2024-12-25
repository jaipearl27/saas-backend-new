import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomLeadType } from './custom-lead-type.schema';
import { User } from './User.schema';

@Schema({ timestamps: true })
export class AttendeeAssociation extends Document {
  @Prop({
    type: String,
    maxlength: 100,
    required: [true, 'Email is required'],
    trim: true,
  })
  email: string; // E-Mail

  @Prop({
    type: Types.ObjectId,
    ref: CustomLeadType.name,
    required: true,
  })
  leadType: Types.ObjectId; //Lead Type

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: [true, 'adminId is required'],
  })
  adminId: Types.ObjectId;
}

export const AttendeeAssociationSchema = SchemaFactory.createForClass(AttendeeAssociation);

// Add index for csvId and recordType fields
AttendeeAssociationSchema.index({ email: 1 });
