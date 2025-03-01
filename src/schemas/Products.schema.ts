import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Products extends Document {
  @Prop({
    type: String,
    required: [true, 'Plan name is required'],
  })
  name: string;

  @Prop({
    type: Number,
    min: 0,
    required: [true, 'Product price is required'],
  })
  price: number;

  @Prop({
    type: String,
    required: [true, 'Product uniqueId is required'],
  })
  uniqueId: string;

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
  })
  level: number;

  @Prop({
    type: String,
    required: false,
  })
  tag: string;
}

export const ProductsSchema = SchemaFactory.createForClass(Products);

ProductsSchema.pre('save', function (next) {
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }
  if (typeof this.webinar === 'string') {
    this.webinar = new Types.ObjectId(`${this.webinar}`);
  }
  next();
});
