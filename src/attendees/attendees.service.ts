import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendee } from 'src/schemas/Attendee.schema';
import { CreateAttendeeDto } from './dto/attendees.dto';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
  ) {}

  async addAttendees(attendees: [CreateAttendeeDto]): Promise<any> {
    const result = await this.attendeeModel.insertMany(attendees);
    return result;
  }

  async getAttendees(
    webinarId: string,
    AdminId: string,
    isAttended: boolean,
    page: number,
    limit: number,
  ): Promise<any> {
    const pipeline = {
      adminId: new Types.ObjectId(`${AdminId}`),
      webinar: new Types.ObjectId(`${webinarId}`),
      isAttended: isAttended,
    };

    const totalAttendees = await this.attendeeModel.countDocuments(pipeline)

    const totalPages = Math.ceil(totalAttendees / limit);

    const skip = (page - 1) * limit;

    const result = await this.attendeeModel
      .find(pipeline)
      .sort({ email: 1 })
      .skip(skip)
      .limit(limit);

    return { totalPages, page, result };
  }
}
