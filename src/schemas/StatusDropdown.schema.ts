import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({timestamps: true})
export class StatusDropdown extends Document {
    @Prop({
        type: String,
        required: [true, 'Status Name is required']
    })
    name: string // Status name

    @Prop({
        type: Types.ObjectId,
        ref: 'users',
        required: [true, 'createdBy/UserId is required']
    })
    createdBy: Types.ObjectId

}

export const StatusDropdownSchema =  SchemaFactory.createForClass(StatusDropdown)