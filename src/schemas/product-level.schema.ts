import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './User.schema';

@Schema({ timestamps: true })
export class ProductLevel extends Document {

  @Prop({
    type: String,
    required: true,
  })
  label: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: [true, 'Admin Id is required'],
  })
  adminId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  level: number;

}


export const ProductLevelSchema = SchemaFactory.createForClass(ProductLevel);


ProductLevelSchema.pre('save', function (next) {
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  next()
});
