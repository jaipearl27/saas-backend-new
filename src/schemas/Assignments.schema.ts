import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Mongoose, Types } from 'mongoose';

export class Assignments extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    required: [true, 'Admin id is required'],
  })
  adminId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    required: [true, 'employee id is required'],
  })
  user: Types.ObjectId;

  @Prop({
    type: String,
    unique: true,
    required: [true, 'Attendee E-Mail is required'],
  })
  email: string;

  @Prop({
    type: String,
    required: [true, 'record type is required'],
    enums: ['preWebinar', 'postWebinar'],
  })
  recordType: string;
}

export const AssignmentsSchema = SchemaFactory.createForClass(Assignments);

AssignmentsSchema.pre('save', function (next) {
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  if (typeof this.user === 'string') {
    this.user = new Types.ObjectId(`${this.user}`);
  }

  next();
});
