import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment } from 'src/schemas/Enrollments.schema';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<Enrollment>,
  ) {}

  async createEnrollment(
    createEnrollmentDto: CreateEnrollmentDto,
  ): Promise<any> {
    const result = await this.enrollmentModel.create(createEnrollmentDto);
    return result;
  }

  async getEnrollment(
    adminId: string,
    webinar: string,
    page: number,
    limit: number,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const pipeline = {
      webinar: new Types.ObjectId(`${webinar}`),
      adminId: new Types.ObjectId(`${adminId}`),
    };

    const totalEnrollments =
      await this.enrollmentModel.countDocuments(pipeline);

    const totalPages = Math.ceil(totalEnrollments / limit);

    const result = await this.enrollmentModel
      .find(pipeline)
      .populate('')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    return { page, totalPages, result };
  }

  async updateEnrollment(
    id: string,
    adminId: string,
    
    updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<any> {
    const result = await this.enrollmentModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      },
      updateEnrollmentDto,
      { new: true },
    );
    return result;
  }

  async deleteEnrollment(id: string, adminId: string): Promise<any> {
    const result = await this.enrollmentModel.findOneAndDelete({
      _id: new Types.ObjectId(`${id}`),
      adminId: new Types.ObjectId(`${adminId}`),
    });
    return result;
  }
}
