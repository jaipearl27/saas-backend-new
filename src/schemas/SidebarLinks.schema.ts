import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SidebarLinks extends Document {
  @Prop({
    type: String,
    required: [true, 'Title is required'],
    minLength: 1,
    maxLength: 50,
    unique: true,
  })
  title: string;

  @Prop({
    type: String,
    required: [true, 'Link is required'],
    minLength: 1,
    maxLength: 2048,
  })
  link: string;
}
