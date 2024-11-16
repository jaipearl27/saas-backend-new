import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notes extends Document {
  @Prop({
    type: String,
    required: [true, 'E-Mail is required'],
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: [true, 'Note is required'],
  })
  note: string;

  @Prop({
    type: String,
    required: [true, 'Phone number is required'],
    default: null,
    trim: true,
  })
  phone: string;

  @Prop({
    type: {
      hr: {
        type: Number,
        default: 0,
      },
      min: {
        type: Number,
        default: 0,
      },
      sec: {
        type: Number,
        default: 0,
      },
    },
  })
  callDuration: {
    hr: string;
    min: string;
    sec: string;
  };

  @Prop({
    type: String,
    required: [true, 'status is required'],
  })
  status: string;

  @Prop({
    type: [],
    required: false,
  })
  image: string[];

  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    required: [true, 'created by id is required'],
  })
  createdBy: Types.ObjectId;
}

export const NotesSchema = SchemaFactory.createForClass(Notes);
