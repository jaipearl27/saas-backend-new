import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Webinar extends Document {
  @Prop({
    type: String,
    required: [true, 'Webinar name is required.'],
  })
  webinarName: string; // Webinar Name

  @Prop({
    type: Date,
    required: false,
  })
  webinarDate: string; // Webinar Date

  @Prop({
    type: Types.ObjectId,
    ref: 'users',
    required: [true, 'Admin Id is required'],
  })
  adminId: Types.ObjectId;
}

export const WebinarSchema = SchemaFactory.createForClass(Webinar);


// Add pre-save middleware to transform `admin` and `plan` to ObjectId
WebinarSchema.pre('save', function (next) {

  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  next();
});


WebinarSchema.index({user: 1})
