import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Assignments extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin id is required'],
  })
  adminId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'employee id is required'],
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Webinar',
    required: [true, 'webinar id is required'],
  })
  webinar: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Attendee',
    required: [true, 'Attendee ID is required'],
  })
  attendee: Types.ObjectId;

  @Prop({
    type: String,
    required: [true, 'record type is required'],
    enums: ['preWebinar', 'postWebinar'],
  })
  recordType: string;

  @Prop({
    type: String,
    lowercase: true,
    enums: ['active', 'inactive', 'completed'],
    defualt: 'active',
  })
  status: string;
}

export const AssignmentsSchema = SchemaFactory.createForClass(Assignments);

AssignmentsSchema.pre('save', function (next) {
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  if (typeof this.user === 'string') {
    this.user = new Types.ObjectId(`${this.user}`);
  }

  if (typeof this.webinar === 'string') {
    this.webinar = new Types.ObjectId(`${this.webinar}`);
  }

  if (typeof this.attendee === 'string') {
    this.attendee = new Types.ObjectId(`${this.attendee}`);
  }

  next();
});
