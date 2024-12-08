import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class FilterPreset extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId; // Admin user

//   @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'users', required: true })
//   userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  tableName: string;

  @Prop({ type: Map, of: MongooseSchema.Types.Mixed, required: true })
  filters: Map<string, any>;
}

export const FilterPresetSchema = SchemaFactory.createForClass(FilterPreset);
