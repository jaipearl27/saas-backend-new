import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProductLevel extends Document {

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin Id is required'],
  })
  adminId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Webinar',
    require: false,
  })
  webinar: Types.ObjectId;

  @Prop({
    type: String,
    required: false,
  })
  description: string; //description

  @Prop({
    type: Number,
    required: true,
    enums: [1, 2, 3],
  })
  level: 1 | 2 | 3;
}

export const ProductLevelSchema = SchemaFactory.createForClass(ProductLevel);


ProductLevelSchema.pre('save', function (next) {
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  next()
});
