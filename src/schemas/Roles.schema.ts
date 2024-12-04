import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

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

export const RolesModel = mongoose.model('roles', RolesSchema, 'roles');
