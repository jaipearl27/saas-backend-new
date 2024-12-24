import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/notes.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { unlinkSync } from 'fs';
import { Id, Role } from 'src/decorators/custom.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image' }]))
  async createNote(
    @UploadedFiles() files: { image: Express.Multer.File[] },
    @Body() body: CreateNoteDto,
    @Id() createdBy: string,
  ) {
    if (!createdBy) {
      throw new BadRequestException('UserID is required.');
    }

    if (Array.isArray(files.image) && files.image.length > 0) {
      const response = await this.cloudinaryService.uploadImage(
        files.image[0].path,
      );
      if (response) console.log(response);
      body.image = { url: response.url, public_id: response.public_id };
      unlinkSync(files.image[0].path);
    }
    const note = await this.notesService.createNote(body, createdBy);
    if (!note) {
      throw new InternalServerErrorException(
        'Faced an error creating note, Please try again later.',
      );
    }

    return note;
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
  async getDashboardNotes(@Id() userId: string, @Role() role: string) {
    if (!userId) {
      throw new BadRequestException('UserID is required.');
    }
    if (
      role === this.configService.get('appRoles')['EMPLOYEE_SALES'] ||
      role === this.configService.get('appRoles')['EMPLOYEE_REMINDER']
    ) {
      const notes = await this.notesService.getNotesByEmployeeId(userId);
      return notes;
    } else if (role === this.configService.get('appRoles')['ADMIN']) {
      const notes = await this.notesService.getNotesByAdminId(userId);
      return notes;
    }
  } 
}
