import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './User.schema'; 

@Schema({ timestamps: true })
export class UserActivity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ default: '' })
  details: string;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  adminId: Types.ObjectId;
}



export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
UserActivitySchema.pre('save', function (next) {
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  if (typeof this.user === 'string') {
    this.user = new Types.ObjectId(`${this.user}`);
  }

  next();
});
