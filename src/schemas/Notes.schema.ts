import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Attendee } from './Attendee.schema';
import { User } from './User.schema';

@Schema({ timestamps: true })
export class Notes extends Document {

  @Prop({
    type: Types.ObjectId,
    ref: Attendee.name,
    required: [true, 'Attendee ID is required'],
  })  
  attendee: Types.ObjectId;

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
    ref: User.name,
    required: [true, 'created by id is required'],
  })
  createdBy: Types.ObjectId;

 
}

export const NotesSchema = SchemaFactory.createForClass(Notes);


NotesSchema.pre('save', function (next) {
  if (typeof this.createdBy === 'string') {
    this.createdBy = new Types.ObjectId(`${this.createdBy}`);
  }
   if (typeof this.attendee === 'string') {
    this.attendee = new Types.ObjectId(`${this.attendee}`);
  }
  next();
});
