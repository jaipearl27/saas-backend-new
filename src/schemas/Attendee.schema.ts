import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './User.schema';
import { Webinar } from './Webinar.schema';

@Schema({ timestamps: true })
export class Attendee extends Document {
  @Prop({
    type: String,
    maxlength: 100,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
  })
  email: string; // E-Mail

  @Prop({
    type: String,
    maxlength: 100,
    trim: true,
    default: null,
    // get: (val: string) => val?.charAt(0).toUpperCase() + val?.slice(1), 
    // set: (val: string) => val?.charAt(0).toUpperCase() + val?.slice(1), 

  })
  firstName: string | null; // First Name

  @Prop({
    type: String,
    maxlength: 100,
    trim: true,
    default: null,
  })
  lastName: string | null; //Last Name

  @Prop({
    type: String,
    maxlength: 20,
    trim: true,
    default: null,
  })
  phone: string | null;

  @Prop({ type: Number, default: 0, min: 0 })
  timeInSession: number; //Time in session

  @Prop({
    type: Types.ObjectId,
    ref: Webinar.name,
    required: true,
  })
  webinar: Types.ObjectId; // Webinar Name

  @Prop({
    type: Boolean,
    required: [true, 'Is Attended is required'],
    default: false,
  })
  isAttended: boolean; //Is attended

  @Prop({
    type: String,
    maxlength: 10,
    lowercase: true,
    enum: ['male', 'female', 'others'],
  })
  gender: string;

  @Prop({
    type: String,
    maxlength: 100,
  })
  location: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: [true, 'adminId is required'],
  })
  adminId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    default: null,
  })
  assignedTo: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    default: null,
  })
  tempAssignedTo: Types.ObjectId | null;

  @Prop({
    type: String,
    maxlength: 200,
    trim: true,
    default: null,
  })
  status: string | null;

  @Prop({
    type: Boolean,
    required: false,
    default: false,
  })
  validCall: boolean;

  @Prop({
    type: Boolean,
    required: false,
    default: false,
  })
  isPulledback: boolean;

  @Prop({
    type: String,
    default: 'Import',
  })
  source: string; 

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];
}

export const AttendeeSchema = SchemaFactory.createForClass(Attendee);

AttendeeSchema.index({ email: 1 });

AttendeeSchema.index({ adminId: 1, webinar: 1, isAttended: 1, email: 1 });
