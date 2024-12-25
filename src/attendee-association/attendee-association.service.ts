import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendeeAssociation } from 'src/schemas/attendee-association.schema';

@Injectable()
export class AttendeeAssociationService {
  constructor(
    @InjectModel(AttendeeAssociation.name)
    private readonly attendeeAssociationModel: Model<AttendeeAssociation>,
  ) {}

  async createAssociation(
    email: string,
    adminId: Types.ObjectId,
    leadTypeId: Types.ObjectId,
  ): Promise<AttendeeAssociation> {
    const association = await this.attendeeAssociationModel.findOne({
      email: email,
      adminId: new Types.ObjectId(`${adminId}`),
    });
    if (association) {
      association.leadType = new Types.ObjectId(`${leadTypeId}`);
      return await association.save();
    }

    const newAssociation = new this.attendeeAssociationModel({
      email: email,
      adminId: new Types.ObjectId(`${adminId}`),
      leadType: new Types.ObjectId(`${leadTypeId}`),
    });
    return await newAssociation.save();
  }

  async getAssociation(
    adminId: Types.ObjectId,
    email: string,
  ): Promise<AttendeeAssociation> {
    const association = await this.attendeeAssociationModel
      .findOne({ adminId: new Types.ObjectId(`${adminId}`), email: email })
      .exec();
    return association ? association : null;
  }
}
