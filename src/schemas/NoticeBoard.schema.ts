import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({timestamps: true})
export class NoticeBoard extends Document {
    @Prop({
        type: Types.ObjectId,
        ref: 'users',
        required: [true, 'User id is required']
    })
    user: Types.ObjectId //userId

    @Prop({
        type:String,
        required: [true, 'Notice Content is required']
    })
    content: string //content

    @Prop({
        type: String,
        enums: ['sales', 'reminder'],
        required: [true, 'Notice For is required']
    })
    noticeFor: string //noticeFor
}

export const NoticeBoardSchema = SchemaFactory.createForClass(NoticeBoard)