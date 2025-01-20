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
import { AssignmentStatus, RecordType } from 'src/schemas/Assignments.schema';

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

  @IsEnum(AssignmentStatus, {
    message: 'assignmentStatus must be a valid value',
  })
  assignmentStatus: AssignmentStatus;
}

export class RequestReAssignmentsDTO {
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true }) // Validate each item in the array as a MongoID
  assignments: string[];

  @IsOptional()
  @IsEnum(['approved', 'rejected'])
  status: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  webinarId?: string;

  @IsOptional()
  @IsString()
  requestReason?: string;
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

  @IsEnum(RecordType)
  recordType: RecordType;

  @IsMongoId()
  webinarId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentAttendee)
  assignments: AssignmentAttendee[];
}

export class FetchReAssignmentsDTO {
  @IsMongoId()
  webinarId?: string;

  @IsEnum(RecordType)
  recordType: RecordType;

  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;
}

export class MoveToPullbacksDTO {
  @IsOptional()
  @IsBoolean()
  isTemp: boolean;

  @IsOptional()
  @IsMongoId()
  employeeId: string;

  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true }) // Validate each item in the array as a MongoID
  attendees: string[];

  @IsEnum(RecordType)
  recordType: RecordType;

  @IsMongoId()
  webinarId: string;
}