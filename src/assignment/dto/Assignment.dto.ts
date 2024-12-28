import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import {
  AttendeesFilterDto,
  CreateAttendeeDto,
} from 'src/attendees/dto/attendees.dto';
import { AssignmentStatus } from 'src/schemas/Assignments.schema';

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

  @IsOptional()
  @IsString()
  validCall?: string;

  @IsOptional()
  @IsMongoId()
  webinarId?: string;

  @IsEnum(AssignmentStatus, { message: 'assignmentStatus must be a valid value' })
  assignmentStatus: AssignmentStatus;
}

export class RequestReAssignmentsDTO {
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true }) // Validate each item in the array as a MongoID
  assignments: string[];
}



class AssignmentAttendee {
  @IsMongoId()
  assignmentId: string;

  @IsMongoId()
  attendeeId: string;
}

export class ReAssignmentDTO {

  @IsBoolean()
  isTemp: boolean;

  @IsMongoId()
  employeeId: string;

  @IsArray()
  @ValidateNested({ each: true }) 
  @Type(() => AssignmentAttendee) 
  assignments: AssignmentAttendee[];
}