import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/notes.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { unlinkSync } from 'fs';
import { AdminId, Id, Role } from 'src/decorators/custom.decorator';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Attendee } from 'src/schemas/Attendee.schema';
import { UsersService } from 'src/users/users.service';
import { AttendeesService } from 'src/attendees/attendees.service';

@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly attendeeService: AttendeesService
  ) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image' }]))
  async createNote(
    @UploadedFiles() files: { image: Express.Multer.File[] },
    @Body() body: CreateNoteDto,
    @Id() createdBy: string,
    @AdminId() adminId: string
  ) {
    if (!createdBy) {
      throw new BadRequestException('UserID is required.');
    }

    const attendee = await this.attendeeService.fetchAttendeeById(new Types.ObjectId(`${body.attendee}`));

    if (
      attendee &&
      [
        String(attendee.assignedTo),
        String(attendee.adminId),
        String(attendee.tempAssignedTo),
      ].includes(String(createdBy))
    ) {
      if (Array.isArray(files.image) && files.image.length > 0) {
        const response = await this.cloudinaryService.uploadImage(
          files.image[0].path,
        );
        body.image = { url: response.url, public_id: response.public_id };
        unlinkSync(files.image[0].path);
      }
      const note = await this.notesService.createNote(body, createdBy, adminId);
      if (!note) {
        throw new InternalServerErrorException(
          'Faced an error creating note, Please try again later.',
        );
      }
      return note;
    } else {
      throw new UnauthorizedException(
        'Only Admin or assigned attendee is allowed to update attendee data.',
      );
    }
  }

  @Get()
  async getNotes(@Query() query: { email: string }) {
    if (!query.email) {
      throw new BadRequestException('Email is required.');
    }
    const notes = await this.notesService.getNotesByEmail(query.email);
    return {
      status: true,
      data: notes,
      message: 'Notes fetched successfully',
    };
  }

  @Get('/dashboard')
  async getDashboardNotes(
    @Id() userId: string,
    @Role() role: string,
    @Query() query: { startDate: string; endDate: string; employeeId: undefined | string },
  ) {
    let isAdminAllowed = false;
    if (query.employeeId) {
      const employee = await this.usersService.getEmployee(query.employeeId);

      if (!employee || employee.adminId.toString() !== userId.toString()) {
        throw new BadRequestException(
          'You are not authorized to access this resource.',
        );
      }
      isAdminAllowed = true;
    }

    if (!userId) {
      throw new BadRequestException('UserID is required.');
    }
    if (
      role === this.configService.get('appRoles')['EMPLOYEE_SALES'] ||
      role === this.configService.get('appRoles')['EMPLOYEE_REMINDER'] ||
      isAdminAllowed
    ) {
      const notes = await this.notesService.getNotesByEmployeeId(
        query.employeeId || userId,
        query.startDate,
        query.endDate,
      );
      return notes;
    } else if (role === this.configService.get('appRoles')['ADMIN']) {
      const notes = await this.notesService.getNotesByAdminId(
        userId,
        query.startDate,
        query.endDate,
      );
      return notes;
    }
  }
}
