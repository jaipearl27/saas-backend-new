import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Attendee extends Document {
  
  @Prop({
    type: String,
    minlength: 1,
    maxlength: 100,
    required: [true, 'Email is required'],
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 100,
    trim: true,
    default: null,
  })
  firstName: string | null;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 100,
    trim: true,
    default: null,
  })
  lastName: string | null;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 20,
    trim: true,
    default: null,
  })
  phone: string | null;

  @Prop({ type: Number, default: 0 })
  timeInSession: number;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 50,
    trim: true,
    default: null,
  })
  leadType: string | null;

  @Prop({
    type: String,
    minlength: 1,
    required: [true, 'Webinar Date is required'],
  })
  date: string;

  @Prop({
    type: String,
    minlength: 1,
    trim: true,
    validate: {
      validator: function (value: string) {
        return this.recordType === 'sales' ? !!value : true;
      },
      message: 'csvName is required for sales records',
    },
  })
  csvName: string;

  @Prop({
    type: String,
    minlength: 1,
    trim: true,
    required: [true, 'csv id is required'],
  })
  csvId: string;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 10,
    enum: ['sales', 'reminder'],
    default: 'sales',
    required: [true, 'csv id is required'],
  })
  recordType: string;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 10,
    enum: ['male', 'female', 'others'],
  })
  gender: string;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 100,
  })
  location: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'adminId is required'],
  })
  adminId: Types.ObjectId;
}

export const AttendeeSchema = SchemaFactory.createForClass(Attendee);

// Add index for csvId and recordType fields
AttendeeSchema.index({ csvId: 1, recordType: 1 });
