import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({timestamps: true})
export class Plans extends Document {

    @Prop({
        type:String,
        required: [true, 'Plan Name is required']
    })
    name: string //action

    @Prop({
        type:String,
        required: false,
        default: ''
    })
    amount: string //details

    @Prop({
        type: Types.ObjectId,
        ref: "users",
        requried: [true, 'AdminId is required']
    })
    adminId:Types.ObjectId

}

export const LogsSchema = SchemaFactory.createForClass(Plans)