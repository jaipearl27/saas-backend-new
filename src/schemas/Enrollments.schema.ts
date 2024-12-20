import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Enrollment extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Attendee',
    required: [true, 'Admin Id is required.'],
  })
  attendee: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Webinar',
    required: [true, 'Webinar Id is required.'],
  })
  webinar: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    require: [true, 'Product ID is required.'],
    unique: true,
  })
  product: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin Id is required'],
  })
  adminId: Types.ObjectId;
}

const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

EnrollmentSchema.pre('save', function (next) {
  if (typeof this.attendee === 'string') {
    this.attendee = new Types.ObjectId(`${this.attendee}`);
  }
  if (typeof this.product === 'string') {
    this.product = new Types.ObjectId(`${this.product}`);
  }
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  next();
});

export { EnrollmentSchema };
