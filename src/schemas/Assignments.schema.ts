import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RecordType {
  PRE_WEBINAR = 'preWebinar',
  POST_WEBINAR = 'postWebinar',
}

export enum AssignmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  REASSIGN_REQUESTED = 'reassignrequested',
  REASSIGN_APPROVED = 'reassignapproved',
}

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
    required: [true, 'Employee id is required'],
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Webinar',
    required: [true, 'Webinar id is required'],
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
    required: [true, 'Record type is required'],
    enum: Object.values(RecordType),
  })
  recordType: RecordType;

  @Prop({
    type: String,
    lowercase: true,
    enum: Object.values(AssignmentStatus),
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus;

  @Prop({
    type: String,
    maxlength: 1000,
  })
  requestReason?: string;
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

AssignmentsSchema.index({ adminId: 1 });
AssignmentsSchema.index({ webinar: 1 });
AssignmentsSchema.index({ attendee: 1 });
