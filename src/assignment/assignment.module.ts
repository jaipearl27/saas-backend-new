import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendee, AttendeeSchema } from 'src/schemas/Attendee.schema';
import { User, UserSchema } from 'src/schemas/User.schema';

@Module({
  imports: [
    
    MongooseModule.forFeature([
      {
        name: Attendee.name,
        schema: AttendeeSchema
      },
      {
        name: User.name,
        schema: UserSchema
      }
    ])
  ],
  providers: [AssignmentService],
  controllers: [AssignmentController]
})
export class AssignmentModule {}
