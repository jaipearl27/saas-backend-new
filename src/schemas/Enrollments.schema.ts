import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Enrollment extends Document {
  @Prop({
    type: String,
    required: [true, 'Attendee E-Mail is required.'],
  })
  attendee: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Webinar',
    required: [true, 'Webinar Id is required.'],
  })
  webinar: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Products',
    require: [true, 'Product ID is required.'],
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
  if (typeof this.webinar === 'string') {
    this.webinar = new Types.ObjectId(`${this.webinar}`);
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
