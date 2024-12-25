import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Notes } from 'src/schemas/Notes.schema';
import { CreateNoteDto } from './dto/notes.dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/schemas/User.schema';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Notes.name) private readonly notesModel: Model<Notes>,
    @InjectModel(User.name) private readonly usersModel: Model<User>,

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

  async getNotesByEmployeeId(employeeId: string, startDate: string, endDate: string):Promise<any> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdBy: new Types.ObjectId(`${employeeId}`),
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
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

  async getNotesByAdminId(id: string,startDate: string, endDate: string):Promise<any> {
    const adminId = new Types.ObjectId(`${id}`);

    // Step 1: Retrieve employees under the given adminId
    const employees = await this.usersModel.find({ adminId }, '_id email userName'); // Retrieve _id and name for employees

    // Step 2: Aggregate notes for each employee
    const results = await Promise.all(
      employees.map(async (employee) => {
        console.log(employee)
        const notesAggregation = await this.notesModel.aggregate([
          {
            $match: {
              createdBy: employee._id, // Match notes created by this employee
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
          },
          {
            $group: {
              _id: '$status', // Group by the status field
              count: { $sum: 1 }, // Count the total for each status
            },
          },
        ]);

        return {
          email: employee.email, // Add employee name
          userName: employee.userName,
          notes: notesAggregation.map((note) => ({
            status: note._id, // Status
            count: note.count, // Total count for this status
          })),
        };
      }),
    );

    return results
  }
}
