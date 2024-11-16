import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({timestamps: true})

export class Roles extends Document {
    @Prop({
            type: String,
            required: [true, "Role name is required"],
            trim: true,
    })
    name: string
}

export const RolesSchema = SchemaFactory.createForClass(Roles)