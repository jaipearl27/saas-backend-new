import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendee } from 'src/schemas/Attendee.schema';
import { CreateAttendeeDto, UpdateAttendeeDto } from './dto/attendees.dto';

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

    const totalAttendees = await this.attendeeModel.countDocuments(pipeline);

    const totalPages = Math.ceil(totalAttendees / limit);

    const skip = (page - 1) * limit;

    const result = await this.attendeeModel
      .find(pipeline)
      .sort({ email: 1 })
      .skip(skip)
      .limit(limit);

    return { totalPages, page, result };
  }

  // async getAttendeesCount(
  //   webinarId: string,
  //   AdminId: string,
  // ): Promise<any> {
  //   const preWebinarPipeline = {
  //     adminId: new Types.ObjectId(`${AdminId}`),
  //     webinar: new Types.ObjectId(`${webinarId}`),
  //     isAttended: false
  //   };

  //   const totalRegisterations = await this.attendeeModel.countDocuments(preWebinarPipeline);

  //   const postWebinarPipeline = {
  //     adminId: new Types.ObjectId(`${AdminId}`),
  //     webinar: new Types.ObjectId(`${webinarId}`),
  //     isAttended: true
  //   };

  //   const totalAttendees = await this.attendeeModel.countDocuments(postWebinarPipeline);

  //   return {totalAttendees, totalRegisterations};
  // }

  async getPostWebinarAttendee(webinarId: string, adminId: string) {
    const result = await this.attendeeModel.findOne({
      webinar: new Types.ObjectId(`${webinarId}`),
      adminId: new Types.ObjectId(`${adminId}`),
      isAttended: true,
    });

    return result;
  }

  async updateAttendee(
    id: string,
    adminId: string,
    updateAttendeeDto: UpdateAttendeeDto,
  ) {
    const result = await this.attendeeModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      },
      updateAttendeeDto,
      { new: true },
    );
    if(!result) throw new NotFoundException('No record found to be updated.')
    return result;
  }

  async deleteAttendees(webinarId: string, AdminId: string): Promise<any> {
    const pipeline = {
      adminId: new Types.ObjectId(`${AdminId}`),
      webinar: new Types.ObjectId(`${webinarId}`),
    };
    console.log(pipeline)
    const result = await this.attendeeModel.deleteMany(pipeline);

    return { message: 'Deleted data successfully!', result: result };
  }
}
