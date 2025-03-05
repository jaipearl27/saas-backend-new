import { MiddlewareConsumer, Module, forwardRef } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notes, NotesSchema } from 'src/schemas/Notes.schema';
import { UsersModule } from 'src/users/users.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { AttendeesModule } from 'src/attendees/attendees.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      {
        name: Notes.name,
        schema: NotesSchema,
      },
    ]),
    AssignmentModule,
    forwardRef(() => AttendeesModule),

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
  exports: [NotesService],
})
export class NotesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GetAdminIdMiddleware)
      .forRoutes(NotesController);

 
  }
}
