import { Prop } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class Assignments extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    required: [true, 'employee id is required'],
  })
  user: Types.ObjectId;

  @Prop({
    type: String,
    unique: true,
    required: [true, 'Attendee E-Mail is required'],
  })
  email: string;

  @Prop({
    type: String,
    required: [true, 'record type is required'],
  })
  recordType: string;
}
