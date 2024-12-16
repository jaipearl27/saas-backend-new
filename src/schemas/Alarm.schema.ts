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
    type: Date,
    required: [true, 'Alarm Date-Time is required '],
  })
  date: Date; //details

  @Prop({
    type: String,
    required: false,
  })
  note: string;
}

export const AlarmSchema = SchemaFactory.createForClass(Alarm);
