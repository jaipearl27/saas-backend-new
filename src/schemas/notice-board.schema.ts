import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class NoticeBoard extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: ['sales', 'reminder'] })
  type: string; // Adding the new 'type' field
}

export const NoticeBoardSchema = SchemaFactory.createForClass(NoticeBoard);
