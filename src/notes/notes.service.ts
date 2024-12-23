import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Notes } from 'src/schemas/Notes.schema';
import { CreateNoteDto } from './dto/notes.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Notes.name) private readonly notesModel: Model<Notes>,
    private readonly usersService: UsersService,
  ) {}

  async createNote(
    body: CreateNoteDto,
    createdBy: string,
  ): Promise<Notes | null> {
    const note = await this.notesModel.create({ ...body, createdBy });
    return note;
  }

  async getNotesByEmail(email: string): Promise<Notes[]> {
    const notes = await this.notesModel.find({ email }).exec();
    return notes;
  }

  async getNotesByEmployeeId(employeeId: string) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdBy: new Types.ObjectId(`${employeeId}`),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];
    const notes = await this.notesModel.aggregate(pipeline).exec();
    return notes;
  }

  async getNotesByAdminId(adminId: string) {
    const Employees = await this.usersService.getEmployees(adminId, 1, 100, {});
    const { result = [] } = Employees;
    const employeeIds = result.map((employee) => employee._id);
    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdBy: { $in: employeeIds },
        },
      },
      { $group: { _id: '$createdBy', notes: { $push: '$$ROOT' } } },
      // Incomplete

    ];
    const notes = await this.notesModel.aggregate(pipeline).exec();
    return notes;
  }
}
