import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './User.schema';

@Schema({ timestamps: true })
export class UserDocuments extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({ type: String, required: true })
  filePath: string;

  @Prop({ type: Number, required: true })
  fileSize: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  downloadCount: number;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ type: Object })
  filters: Record<string, any>;
}

export const UserDocumentsSchema = SchemaFactory.createForClass(UserDocuments);

UserDocumentsSchema.index({ userId: 1, fileName: 1 }, { unique: true });
