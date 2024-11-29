import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LandingPage extends Document {
  @Prop({
    type: String,
    minlength: 1,
    maxlength: 500,
    required: [true, 'Title is required'],
  })
  title: string;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 5000,
    required: [true, 'Sub Title is required'],
  })
  subTitle: string;

  @Prop({
    type: String,
    minlength: 1,
    maxlength: 5000,
    required: false,
  })
  link: string;

  @Prop({
    type: {},
    requried: [true, 'file is required'],
  })
  file: any;

  @Prop({
    type: String,
    requried: false,
  })
  buttonName: string;

  @Prop({
    type: Boolean,
    requried: false,
  })
  videoControls: boolean;

  @Prop({
    type: Number,
    requried: false,
  })
  buttonHeight: number;

  @Prop({
    type: Number,
    requried: false,
  })
  buttonWidth: number;
}

export const LandingPageSchema = SchemaFactory.createForClass(LandingPage)
