import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  
  @Prop({
    type: String,
    required: [true, 'E-mail is required'],
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: [true, 'userName is required'],
    trim: true,
  })
  userName: string;

  @Prop({
    type: String,
    trim: true,
  })
  phone: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: String,
    required: [true, 'password is required'],
    trim: true,
  })
  password: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    default: process.env.ROLES && JSON.parse(process.env.ROLES).SUPER_ADMIN,
  })
  adminId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'plan',
  })
  plan: Types.ObjectId;

  @Prop({
    type: Date,
  })
  currentPlanExpiry: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'roles',
    required: [true, 'role is required'],
  })
  role: Types.ObjectId;

  @Prop({
    type: String,
    required: false,
  })
  pabblyToken: string;

  @Prop({
    required: false,
    type: [
      {
        email: {
          type: String,
          unique: true,
        },
        recordType: {
          type: String,
        },
      },
    ],
  })
  assignments?: {
    email: string;
    recordType: string;
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);

const rolesEnv = process.env.ROLES ? JSON.parse(process.env.ROLES) : {};
UserSchema.path('adminId').default(() => rolesEnv.SUPER_ADMIN);
