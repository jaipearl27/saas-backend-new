import { MiddlewareConsumer, Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notes, NotesSchema } from 'src/schemas/Notes.schema';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/schemas/User.schema';
import { Attendee, AttendeeSchema } from 'src/schemas/Attendee.schema';
import { Assignments, AssignmentsSchema } from 'src/schemas/Assignments.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      {
        name: Notes.name,
        schema: NotesSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Attendee.name,
        schema: AttendeeSchema,
      },
      {
        name: Assignments.name,
        schema: AssignmentsSchema,
      },
    ]),

    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
  ],
  controllers: [NotesController],
  providers: [NotesService, CloudinaryService],
})
export class NotesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthTokenMiddleware)
      .forRoutes(NotesController);

 
  }
}
