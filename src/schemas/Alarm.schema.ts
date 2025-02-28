import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Attendee } from './Attendee.schema';

@Schema({ timestamps: true })
export class Alarm extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'User id is required'],
  })
  user: Types.ObjectId; //userId

  @Prop({
    type: String,
    required: [true, 'Attendee E-Mail is required.']
  })
  email: string

  @Prop({
    type: Types.ObjectId,
    ref: Attendee.name,
    required: [true, 'Attendee ID is required.']
  })
  attendeeId: Types.ObjectId

  @Prop({
    type: Date,
    required: [true, 'Alarm Date-Time is required '],
  })
  date: Date; //details

  @Prop({
    type: Boolean,
    default: true
  })
  isActive: boolean; 

  @Prop({
    type: String,
    required: false,
    maxlength: 600,
  })
  note: string;
}

export const AlarmSchema = SchemaFactory.createForClass(Alarm);

AlarmSchema.pre('save', function (next) {
  if(typeof this.user === 'string'){
    this.user = new Types.ObjectId(`${this.user}`)
  }

  if(typeof this.attendeeId === 'string'){
    this.attendeeId = new Types.ObjectId(`${this.attendeeId}`)
  }
  next();
})