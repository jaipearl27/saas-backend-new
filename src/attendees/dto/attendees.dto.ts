import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsNumber,
    MaxLength,
    IsObject,
    ValidateNested,
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
    @IsEnum(['male', 'female', 'others'], { message: 'Gender must be one of male, female, or others' })
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
    @IsMongoId({ message: 'assignedTo must be a valid MongoId' })
    @IsNotEmpty({ message: 'assignedTo is required' })
    assignedTo: Types.ObjectId;
  
    // @IsOptional()
    // @IsArray({ message: 'Products must be an array' })
    // @IsMongoId({ each: true, message: 'Each product ID must be a valid MongoId' })
    // products?: string[];
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
    leadType?:  Types.ObjectId | null;

    @IsOptional()
    @IsBoolean({ message: 'IsAttended must be a boolean' })
    @IsNotEmpty({ message: 'IsAttended is required' })
    isAttended: boolean;
  
    @IsOptional()
    @IsEnum(['male', 'female', 'others'], { message: 'Gender must be one of male, female, or others' })
    gender?: string;
  
    @IsOptional()
    @IsString({ message: 'Location must be a string' })
    
    @IsOptional()
    @MaxLength(100, { message: 'Location can be up to 100 characters long' })
    location?: string;

    @IsOptional()
    @IsMongoId({ message: 'assignedTo must be a valid MongoId' })
    assignedTo: Types.ObjectId;

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
}

export class GetAttendeesDTO {
  @IsString()
  webinarId: string; 

  @IsBoolean()
  isAttended: boolean;

  @IsOptional()
  @IsString()
  validCall?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AttendeesFilterDto)
  filters: AttendeesFilterDto;  
}
