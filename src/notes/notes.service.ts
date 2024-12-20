import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notes } from 'src/schemas/Notes.schema';
import { CreateNoteDto } from './dto/notes.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Notes.name) private readonly notesModel: Model<Notes>,
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
}
