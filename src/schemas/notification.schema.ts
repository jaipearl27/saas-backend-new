import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './User.schema';

export enum notificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum notificationActionType {
  REASSIGNMENT = 'reassignment',
  ASSIGNMENT = 'assignment',
  USER_ACTIVITY = 'user_activity',
  WEBINAR_ASSIGNMENT = 'webinar_assignment',
  ACCOUNT_DEACTIVATION = 'account_deactivation' 
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  recipient: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({
    type: String,
    required: true,
    enum: notificationType,
    default: 'info',
  })
  type: notificationType;

  @Prop({
    type: String,
    required: true,
    enum: notificationActionType,
  })
  actionType: notificationActionType;

  @Prop({ type: Boolean, default: false })
  isSeen: boolean;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipient: 1 });

NotificationSchema.pre('save', function (next) {
  if (typeof this.recipient === 'string') {
    this.recipient = new Types.ObjectId(`${this.recipient}`);
  }
  next();
});
