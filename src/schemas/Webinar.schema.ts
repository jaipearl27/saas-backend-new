import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Webinar extends Document {
  @Prop({
    type: String,
    required: [true, 'Webinar name is required.'],
  })
  webinarName: string; // Webinar Name

  @Prop({
    type: Date,
    required: false,
  })
  webinarDate: string; // Webinar Date

  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    required: [true, 'Admin Id is required'],
  })
  adminId: Types.ObjectId;
}

export const WebinarSchema = SchemaFactory.createForClass(Webinar);

WebinarSchema.index({user: 1})
