import { Type } from 'class-transformer';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { AttendeesFilterDto, CreateAttendeeDto } from 'src/attendees/dto/attendees.dto';

export class AssignmentDto {
  @IsOptional()
  @IsString()
  adminId: string;
  
  @IsOptional()
  @IsString()
  user: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  webinar: string;

  @IsString()
  @IsNotEmpty()
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

export class GetAssignmentDTO {

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AttendeesFilterDto)
  filters: AttendeesFilterDto;
}