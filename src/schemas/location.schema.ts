// addon.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './User.schema';

@Schema({ timestamps: true })
export class Location extends Document {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  name: string;

  @Prop({ type: Boolean, required: true })
  isVerified: boolean;

  @Prop({ type: Types.ObjectId, ref: User.name, required: false })
  admin: Types.ObjectId;

  @Prop({ type: Boolean, required: false })
  isAdminVerified: boolean;

  @Prop({ type: Types.ObjectId, ref: User.name, required: false })
  employee: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  deactivated: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.pre('save', function (next) {
  if (typeof this.admin === 'string') {
    this.admin = new Types.ObjectId(`${this.admin}`);
  }

  if (typeof this.employee === 'string') {
    this.employee = new Types.ObjectId(`${this.employee}`);
  }
  next();
});
