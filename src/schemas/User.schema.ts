import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DateFormat {
  DD_MM_YYYY = "dd-mm-yyyy",
  MM_DD_YYYY = "mm-dd-yyyy",
  YYYY_MM_DD = "yyyy-mm-dd",
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    type: String,
    required: [true, 'E-mail is required'],
    trim: true,
    lowercase: true,
    unique: true,
  })
  email: string; //E-Mail

  @Prop({
    type: String,
    trim: true,
  })
  companyName: string; //company name

  @Prop({
    type: String,
    required: [true, 'userName is required'],
    trim: true,
  })
  userName: string; //User Name

  @Prop({
    type: String,
    trim: true,
  })
  phone: string; //Phone

  @Prop({
    type: String,
    trim: true,
    required: false,
  })
  alarmPhone: string; //Phone number for alarm msg

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean; //isActive

  @Prop({
    type: String,
    required: false,
    minlength: 1,
    maxlength: 1000,
    trim: true,
  })
  statusChangeNote: string; //isActive

  @Prop({
    type: String,
    required: [true, 'password is required'],
    trim: true,
  })
  password: string; //password

  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    default: process.env.ROLES && JSON.parse(process.env.ROLES).SUPER_ADMIN,
  })
  adminId: Types.ObjectId; //adminId

  @Prop({
    type: Types.ObjectId,
    ref: 'roles',
    required: [true, 'role is required'],
  })
  role: Types.ObjectId; //role

  @Prop({
    type: String,
    required: false,
  })
  pabblyToken: string;

  @Prop({
    type: String,
    required: false,
  })
  refreshToken: string;

  @Prop({
    type: Number,
    required: false,
    min: 0,
  })
  validCallTime: number;

  @Prop({
    type: Number,
    required: false,
    min: 0,
  })
  dailyContactLimit: number;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  dailyContactCount: number;

  @Prop({
    type: Number,
    required: false,
    min: 1,
  })
  inactivityTime: number;

  @Prop({ type: String, select: false })
  oneTimePassword?: string;

  @Prop({
    type: Date,
  })
  otpExpiration?: Date;

  @Prop({ type: Number, default: 0 })
  failedOtpAttempts?: number;

  @Prop({ type: Date })
  accountLockedUntil?: Date;

  @Prop({
    type: [
      {
        fieldname: String,
        originalname: String,
        encoding: String,
        mimetype: String,
        destination: String,
        filename: String,
        path: String,
        size: Number,
      },
    ],
    requried: false,
  })
  documents: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
  }[];

  @Prop({
    type: String,
    required: false,
  })
  gst: string;

  @Prop({
    type: String,
    required: false,
    default: DateFormat.DD_MM_YYYY,
    enum: DateFormat,
  })
  dateFormat: DateFormat;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', function (next) {
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  if (typeof this.role === 'string') {
    this.role = new Types.ObjectId(`${this.role}`);
  }
  next();
});

const rolesEnv = process.env.ROLES ? JSON.parse(process.env.ROLES) : {};
UserSchema.path('adminId').default(() => rolesEnv.SUPER_ADMIN);

export { UserSchema };

UserSchema.index({ adminId: 1 });
