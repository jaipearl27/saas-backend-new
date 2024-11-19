import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({timestamps: true})
export class Plans extends Document {

    @Prop({
        type:String,
        required: [true, 'Plan Name is required']
    })
    name: string //plan name

    @Prop({
        type:String,
        required: [true, 'Plan Amount is required'],
        default: ''
    })
    amount: string //plan amount

 
}

export const PlansSchema = SchemaFactory.createForClass(Plans)