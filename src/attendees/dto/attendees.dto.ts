import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  isArray,
  IsString,
  IsNumber,
  MaxLength,
  IsObject,
  ValidateNested,
  IsArray,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';
import { RangeNumberDto } from 'src/users/dto/filters.dto';

export class CreateAttendeeDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name can be up to 100 characters long' })
  firstName?: string | null;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name can be up to 100 characters long' })
  lastName?: string | null;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @MaxLength(20, { message: 'Phone number can be up to 20 characters long' })
  phone?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'Time in session must be a number' })
  timeInSession?: number = 0;

  @IsOptional()
  @IsMongoId({ message: 'Webinar must be a valid MongoId' })
  @IsNotEmpty({ message: 'Webinar is required' })
  webinar: Types.ObjectId;

  @IsOptional()
  @IsBoolean({ message: 'IsAttended must be a boolean' })
  @IsNotEmpty({ message: 'IsAttended is required' })
  isAttended: boolean;


  @IsOptional()
  @IsEnum(['male', 'female', 'others'], {
    message: 'Gender must be one of male, female, or others',
  })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(100, { message: 'Location can be up to 100 characters long' })
  location?: string;

  @IsOptional()
  @IsMongoId({ message: 'Admin ID must be a valid MongoId' })
  @IsNotEmpty({ message: 'Admin ID is required' })
  adminId: Types.ObjectId;

  @IsOptional()
  @IsMongoId({ message: 'Attendee Id must be a valid MongoId' })
  attendeeId?: Types.ObjectId;

  @IsOptional()
  @IsString({ message: 'Source must be a string' })
  source?: string;

  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  tags: string[];
}

export class UpdateAttendeeDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name can be up to 100 characters long' })
  firstName?: string | null;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name can be up to 100 characters long' })
  lastName?: string | null;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @MaxLength(20, { message: 'Phone number can be up to 20 characters long' })
  phone?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'Time in session must be a number' })
  timeInSession?: number = 0;

  @IsOptional()
  @IsMongoId({ message: 'Lead type must be a valid MongoId' })
  leadType?: Types.ObjectId | null;

  @IsOptional()
  @IsBoolean({ message: 'IsAttended must be a boolean' })
  @IsNotEmpty({ message: 'IsAttended is required' })
  isAttended?: boolean;

  @IsOptional()
  @IsEnum(['male', 'female', 'others'], {
    message: 'Gender must be one of male, female, or others',
  })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Location can be up to 100 characters long' })
  location?: string;

  @IsOptional()
  @IsMongoId({ message: 'assignedTo must be a valid MongoId' })
  assignedTo?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  validCall?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  // @IsOptional()
  // @IsArray({ message: 'Products must be an array' })
  // @IsMongoId({ each: true, message: 'Each product ID must be a valid MongoId' })
  // products?: string[];
}

export class AttendeesFilterDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsObject()
  timeInSession?: RangeNumberDto;

  @IsOptional()
  @IsString()
  gender?: 'male' | 'female' | 'others';

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  isAssigned?: string;

  @IsOptional()
  @IsMongoId()
  leadType?: Types.ObjectId;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({each: true})
  enrollments?: string[];

}

export class GroupedAttendeesFilterDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsObject()
  timeInSession?: RangeNumberDto;

  @IsOptional()
  @IsMongoId()
  leadType?: Types.ObjectId;

  @IsOptional()
  @IsObject()
  attendedWebinarCount?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  registeredWebinarCount?: RangeNumberDto;

  @IsOptional()
  @IsMongoId()
  lastAssignedTo?: string;

  @IsOptional()
  @IsString()
  lastStatus?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({each: true})
  enrollments?: string[]
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}


export enum WebinarAttendeesSortBy {
  EMAIL = 'email',
  TIME_IN_SESSION = 'timeInSession',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum GroupedAttendeesSortBy {
  EMAIL = '_id',
  ATTENDED_WEBINAR_COUNT = 'attendedWebinarCount',
  TIME_IN_SESSION = 'timeInSession',
  REGISTERED_WEBINAR_COUNT = 'registeredWebinarCount',
}

export class WebinarAttendeesSortObject {
  @IsString()
  @IsEnum(SortOrder)
  sortOrder: SortOrder;

  @IsString()
  @IsEnum(WebinarAttendeesSortBy)
  sortBy: WebinarAttendeesSortBy;
}

export class GroupedAttendeesSortObject {
  @IsString()
  @IsEnum(SortOrder)
  sortOrder: SortOrder;

  @IsString()
  @IsEnum(GroupedAttendeesSortBy)
  sortBy: GroupedAttendeesSortBy;
}

export class FetchGroupedAttendeesDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => GroupedAttendeesFilterDto)
  filters: GroupedAttendeesFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GroupedAttendeesSortObject)
  sort?: GroupedAttendeesSortObject;
}

export class GetAttendeesDTO {
  @IsMongoId()
  webinarId: string;

  @IsBoolean()
  isAttended: boolean;

  @IsOptional()
  @IsString()
  validCall?: string;

  @IsOptional()
  @IsString()
  assignmentType?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AttendeesFilterDto)
  filters: AttendeesFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebinarAttendeesSortObject)
  sort?: WebinarAttendeesSortObject;
}

export class SwapAttendeeFieldsDTO {
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true })
  attendees: string[];

  @IsNotEmpty()
  @IsString()
  field1?: string;

  @IsNotEmpty()
  @IsString()
  field2?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AttendeesFilterDto)
  filters: AttendeesFilterDto;

  @IsMongoId()
  webinarId: string;

  @IsBoolean()
  isAttended: boolean;

  @IsOptional()
  @IsString()
  validCall?: string;

  @IsOptional()
  @IsString()
  assignmentType?: string;

}


export class ExportWebinarAttendeesDTO extends GetAttendeesDTO {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  columns: string[];

  @IsNumber()
  @Min(0, { message: 'Export limit must be a non-negative integer.' })
  limit: number;
}


export class ExportGroupedAttendeesDTO {


  @IsNotEmpty()
  @ValidateNested()
  @Type(() => GroupedAttendeesFilterDto)
  filters: GroupedAttendeesFilterDto;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  columns: string[];

  @IsNumber()
  @Min(0, { message: 'Export limit must be a non-negative integer.' })
  limit: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => GroupedAttendeesSortObject)
  sort?: GroupedAttendeesSortObject;  
}
