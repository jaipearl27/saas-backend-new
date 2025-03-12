import { Inject, forwardRef, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, PipelineStage, Types } from 'mongoose';
import { Notes } from 'src/schemas/Notes.schema';
import { CreateNoteDto } from './dto/notes.dto';
import { UsersService } from 'src/users/users.service';
import { AssignmentService } from 'src/assignment/assignment.service';
import { AttendeesService } from 'src/attendees/attendees.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Notes.name) private readonly notesModel: Model<Notes>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly assignService: AssignmentService,
    @Inject(forwardRef(() => AttendeesService))
    private readonly attendeeService: AttendeesService,
  ) {}

  async createNote(
    body: CreateNoteDto, 
    createdBy: string,
    adminId: string,
  ): Promise<Notes | null> {
    //check if note's callduration >= user's validCallTime to add validCall: true in attendee

    const user = await this.usersService.getUserById(createdBy);
    let validCall = false;

    if (user && user?.validCallTime) {
      const callDuration = body.callDuration;
      const totalCallDuration: number =
        Number(callDuration.hr) * 60 * 60 +
        Number(callDuration.min) * 60 +
        Number(callDuration.sec);
      if (totalCallDuration >= user.validCallTime) {
        validCall = true;
      }
    }

    await this.attendeeService.updateAttendee(
      body.attendee,
      adminId,
      createdBy,
      { status: body.status, ...(validCall ? { validCall } : {}) },
    );

    const note = await this.notesModel.create({
      ...body,
      createdBy,
      isWorked: body.isWorked === 'true' ? true : false,
    });

    this.attendeeService.emitNoteCreation(adminId);
    return note;
  }

  async getNotesByEmail(email: string): Promise<Notes[]> {
    const notes = await this.notesModel
      .find({ email })
      .populate('createdBy', 'userName')
      .sort({ createdAt: -1 })
      .exec();
    return notes;
  }

  async getNotesByEmployeeId(
    employeeId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdBy: new Types.ObjectId(`${employeeId}`), // Match notes created by this employee
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },

      {
        $lookup: {
          from: 'attendees',
          localField: 'attendee',
          foreignField: '_id',
          as: 'attendee',
        },
      },
      {
        $unwind: '$attendee', // Unwind the attendee array to make it easier to reference fields
      },
      {
        $lookup: {
          from: 'webinars',
          localField: 'attendee.webinar',
          // Field in the attendee document referencing webinar
          foreignField: '_id',
          // Field in the webinars collection to match
          as: 'webinar', // Output field for the joined data
        },
      },
      {
        $unwind: '$webinar',
      },
      {
        $addFields: {
          webinarName: '$webinar.webinarName',
          webinarId: '$webinar._id',
        },
      },
      {
        $facet: {
          webinarGroup: [
            {
              $group: {
                _id: '$webinarName',
                webinarId: { $first: '$webinarId' },
              },
            },
          ],
          statusGroup: [
            {
              $group: {
                _id: '$status',
                // Group by the status field
                count: {
                  $sum: 1,
                }, // Count the total for each status
              },
            },
          ],
        },
      },
    ];
    const notes = await this.notesModel.aggregate(pipeline).exec();

    const totalAssignmentsAggregation =
      await this.assignService.fetchTotalAssignmentsForNotes(
        employeeId,
        startDate,
        endDate,
      );

    const totalWorkedPipeline: PipelineStage[] = [
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
        $addFields: {
          totalSeconds: {
            $add: [
              {
                $multiply: [
                  {
                    $toInt: '$callDuration.hr',
                  },
                  3600,
                ],
              },
              {
                $multiply: [
                  {
                    $toInt: '$callDuration.min',
                  },
                  60,
                ],
              },
              {
                $toInt: '$callDuration.sec',
              },
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            {
              isWorked: true,
            },
            {
              totalSeconds: {
                $gte: 10,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: '$email',
        },
      },
      {
        $group: {
          _id: null,
          totalWorked: {
            $sum: 1,
          },
        },
      },
    ];

    const totalWorkedAggregation =
      await this.notesModel.aggregate(totalWorkedPipeline);

    return {
      metrics: notes,
      totalAssignments: totalAssignmentsAggregation[0]?.totalAssignments || 0,
      totalWorked: totalWorkedAggregation[0]?.totalWorked || 0,
    };
  }

  async getNotesByAdminId(
    id: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const adminId = new Types.ObjectId(`${id}`);
    // Step 1: Retrieve employees under the given adminId
    const employees = await this.usersService.getEmployeesForNotes(
      adminId
    )// Retrieve _id and name for employees
    // Step 2: Aggregate notes for each employee
    const results = await Promise.all(
      employees.map(async (employee) => {
        // console.log(employee);
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
            $lookup: {
              from: 'attendees',
              localField: 'attendee',
              foreignField: '_id',
              as: 'attendee',
            },
          },
          {
            $unwind: '$attendee', // Unwind the attendee array to make it easier to reference fields
          },
          {
            $lookup: {
              from: 'webinars',
              localField: 'attendee.webinar',
              // Field in the attendee document referencing webinar
              foreignField: '_id',
              // Field in the webinars collection to match
              as: 'webinar', // Output field for the joined data
            },
          },
          {
            $unwind: '$webinar',
          },
          {
            $addFields: {
              webinarName: '$webinar.webinarName',
            },
          },
          {
            $facet: {
              webinarGroup: [
                {
                  $group: {
                    _id: '$webinarName',
                  },
                },
              ],
              statusGroup: [
                {
                  $group: {
                    _id: '$status',
                    // Group by the status field
                    count: {
                      $sum: 1,
                    }, // Count the total for each status
                  },
                },
              ],
            },
          },
        ]);

        const totalAssignmentsAggregation =
          await this.assignService.fetchAssignmentsForNotes(
            employee._id as Types.ObjectId,
            startDate,
            endDate,
          );

        const totalWorkedPipeline: PipelineStage[] = [
          {
            $match: {
              createdBy: new Types.ObjectId(`${employee._id}`),
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
          },
          {
            $addFields: {
              totalSeconds: {
                $add: [
                  {
                    $multiply: [
                      {
                        $toInt: '$callDuration.hr',
                      },
                      3600,
                    ],
                  },
                  {
                    $multiply: [
                      {
                        $toInt: '$callDuration.min',
                      },
                      60,
                    ],
                  },
                  {
                    $toInt: '$callDuration.sec',
                  },
                ],
              },
            },
          },
          {
            $match: {
              $or: [
                {
                  isWorked: true,
                },
                {
                  totalSeconds: {
                    $gte: 10,
                  },
                },
              ],
            },
          },
          {
            $group: {
              _id: '$email',
            },
          },
          {
            $group: {
              _id: null,
              totalWorked: {
                $sum: 1,
              },
            },
          },
        ];

        const totalWorkedAggregation =
          await this.notesModel.aggregate(totalWorkedPipeline);

        return {
          email: employee.email, // Add employee name
          userName: employee.userName,
          metrics: notesAggregation,
          totalAssignments:
            totalAssignmentsAggregation[0]?.totalAssignments || 0,
          totalWorked: totalWorkedAggregation[0]?.totalWorked || 0,
        };
      }),
    );

    return results;
  }

  async deleteNotesByAttendees(attendees: Types.ObjectId[],session: ClientSession){
    return this.notesModel.deleteMany({attendee: {$in: attendees}}).session(session).exec();
    // TODO: Delete images from cloudinary
  }
}
