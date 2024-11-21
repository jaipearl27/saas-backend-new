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
        type:Number,
        min: 1,
        required: [true, 'Plan Amount is required'],
    })
    amount: number //plan amount

    @Prop({
        type:Number,
        min:1,
        required: [true, 'Employee Count is required'],
    })
    employeeCount: number //Employee Count

    @Prop({
        type:Number,
        min:1,
        required: [true, 'Contact Limit is required'],
    })
    contactLimit: number //Employee Count

    @Prop({
        type:Boolean,
        min:1,
        default: false
    })
    incrementContact: boolean //Employee Count

    @Prop({
        type:Number,
        min:1,
        required: [true, 'Plan Duration(in days) is required'],
    })
    planDuration: number //Plan duration
 
}

export const PlansSchema = SchemaFactory.createForClass(Plans)