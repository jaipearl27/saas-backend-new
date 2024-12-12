import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Attendee extends Document {
  @Prop({
    type: String,
    maxlength: 100,
    required: [true, 'Email is required'],
    trim: true,
  })
  email: string; // E-Mail

  @Prop({
    type: String,
    maxlength: 100,
    trim: true,
    default: null,
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
  phone: string | null; //Phone

  @Prop({ type: Number, default: 0 })
  timeInSession: number; //Time in session

  @Prop({
    type: String,
    maxlength: 50,
    trim: true,
    default: null,
  })
  leadType: string | null; //Lead Type

  @Prop({
    type: Types.ObjectId,
    ref: 'Webinar',
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
    enum: ['male', 'female', 'others', 'Male', 'Female', 'Others'],
  })
  gender: string;

  @Prop({
    type: String,
    maxlength: 100,
  })
  location: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    required: [true, 'adminId is required'],
  })
  adminId: Types.ObjectId;

  // @Prop({
  //   type: [
  //     {
  //       type: Types.ObjectId,
  //       ref: 'products'
  //     }
  //   ],
  //   required: false
  // })
  // products: string
}

export const AttendeeSchema = SchemaFactory.createForClass(Attendee);

// Add index for csvId and recordType fields
AttendeeSchema.index({ webinar: 1, recordType: 1 });
