import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
    type: Date,
    required: [true, 'Alarm Date-Time is required '],
  })
  date: Date; //details

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
  next();
})