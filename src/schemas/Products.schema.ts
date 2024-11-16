import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({timestamps: true}) 

export class Products extends Document {

    @Prop({
        type: String,
        required: [true, "Plan name is required"],
      })
      name: string

      @Prop({
        type: Number,
        required: [true, 'Product price is required']
      })
      price: number

      @Prop({
        type: Types.ObjectId,
        required: [true, "Admin Id is required"],
      })
      adminId: Types.ObjectId

      @Prop({
        type: String,
        require: [true, "Webinar name is required"],
      })
      webinarNamw: string

      @Prop({
        type: String,
        required: false
      })
      description: string //description
}


export const ProductsSchema = SchemaFactory.createForClass(Products)

