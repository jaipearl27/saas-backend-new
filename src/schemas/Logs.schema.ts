import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({timestamps: true})
export class Logs extends Document {
    @Prop({
        type: Types.ObjectId,
        ref: 'users',
        required: [true, 'User id is required']
    })
    user: Types.ObjectId //userId

    @Prop({
        type:String,
        required: [true, 'Action is required']
    })
    action: string //action

    @Prop({
        type:String,
        required: false,
        default: ''
    })
    details: string //details

    @Prop({
        type: Types.ObjectId,
        ref: "users",
        requried: [true, 'AdminId is required']
    })
    adminId:Types.ObjectId

}

export const LogsSchema = SchemaFactory.createForClass(Logs)