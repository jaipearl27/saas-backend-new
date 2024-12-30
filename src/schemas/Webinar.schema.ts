import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { User } from './User.schema';

@Schema({ timestamps: true })
export class Webinar extends Document {
  @Prop({
    type: String,
    required: [true, 'Webinar name is required.'],
  })
  webinarName: string; // Webinar Name

  @Prop({
    type: Date,
    required: false,
  })
  webinarDate: string; // Webinar Date

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: [true, 'Admin Id is required'],
  })
  adminId: Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }],
    required: false,
  })
  assignedEmployees: Types.ObjectId[]; // Assigned Employees
}

export const WebinarSchema = SchemaFactory.createForClass(Webinar);

// Add pre-save middleware to transform `adminId` and `assignedEmployees` to ObjectId
WebinarSchema.pre('save', function (next) {
  if (typeof this.adminId === 'string') {
    this.adminId = new Types.ObjectId(`${this.adminId}`);
  }

  if (Array.isArray(this.assignedEmployees)) {
    this.assignedEmployees = this.assignedEmployees.map((employee) =>
      typeof employee === 'string' ? new Types.ObjectId(`${employee}`) : employee
    );
  }

  next();
});

WebinarSchema.index({ user: 1 });