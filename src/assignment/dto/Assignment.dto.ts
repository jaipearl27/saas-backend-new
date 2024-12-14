import { Type } from 'class-transformer';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { CreateAttendeeDto } from 'src/attendees/dto/attendees.dto';

export class AssignmentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  adminId: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  user: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  webinar: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  attendee: string;

  @IsString()
  @IsNotEmpty()
  recordType: 'preWebinar' | 'postWebinar';
}

export class preWebinarAssignmentDto {
  @IsMongoId()
  webinar: string; // Must be a valid MongoDB ObjectId

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateAttendeeDto)
  attendee: CreateAttendeeDto;
}
