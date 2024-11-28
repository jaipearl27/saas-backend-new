import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Otp extends Document {
  @Prop({ type: String, required: true, minlength: 6, maxlength: 6 })
  otp: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'users' })
  user: Types.ObjectId;

  @Prop({ type: Date, default: Date.now(), expires: 300 })

  date: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp)
