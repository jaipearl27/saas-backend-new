import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsArray,
    IsNumber,
    MinLength,
    MaxLength,
    IsObject,
  } from 'class-validator';
  import { Types } from 'mongoose';
  
  export class CreateAttendeeDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
  
    @IsOptional()
    @IsString({ message: 'First name must be a string' })
    @MinLength(1, { message: 'First name must be at least 1 character long' })
    @MaxLength(100, { message: 'First name can be up to 100 characters long' })
    firstName?: string | null;
  
    @IsOptional()
    @IsString({ message: 'Last name must be a string' })
    @MinLength(1, { message: 'Last name must be at least 1 character long' })
    @MaxLength(100, { message: 'Last name can be up to 100 characters long' })
    lastName?: string | null;
  
    @IsOptional()
    @IsString({ message: 'Phone number must be a string' })
    @MinLength(1, { message: 'Phone number must be at least 1 character long' })
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
    @MinLength(1, { message: 'Location must be at least 1 character long' })
    @MaxLength(100, { message: 'Location can be up to 100 characters long' })
    location?: string;
  
    @IsOptional()
    @IsMongoId({ message: 'Admin ID must be a valid MongoId' })
    @IsNotEmpty({ message: 'Admin ID is required' })
    adminId: Types.ObjectId;
  
    // @IsOptional()
    // @IsArray({ message: 'Products must be an array' })
    // @IsMongoId({ each: true, message: 'Each product ID must be a valid MongoId' })
    // products?: string[];
  }
  
  
  export class UpdateAttendeeDto {
    @IsOptional()
    @IsString({ message: 'First name must be a string' })
    @MinLength(1, { message: 'First name must be at least 1 character long' })
    @MaxLength(100, { message: 'First name can be up to 100 characters long' })
    firstName?: string | null;
  
    @IsOptional()
    @IsString({ message: 'Last name must be a string' })
    @MinLength(1, { message: 'Last name must be at least 1 character long' })
    @MaxLength(100, { message: 'Last name can be up to 100 characters long' })
    lastName?: string | null;
  
    @IsOptional()
    @IsString({ message: 'Phone number must be a string' })
    @MinLength(1, { message: 'Phone number must be at least 1 character long' })
    @MaxLength(20, { message: 'Phone number can be up to 20 characters long' })
    phone?: string | null;
  
    @IsOptional()
    @IsNumber({}, { message: 'Time in session must be a number' })
    timeInSession?: number = 0;
  
    @IsOptional()
    @IsString({ message: 'Lead type must be a string' })
    @MinLength(1, { message: 'Lead type must be at least 1 character long' })
    @MaxLength(50, { message: 'Lead type can be up to 50 characters long' })
    leadType?: string | null;

    @IsOptional()
    @IsBoolean({ message: 'IsAttended must be a boolean' })
    @IsNotEmpty({ message: 'IsAttended is required' })
    isAttended: boolean;
  
    @IsOptional()
    @IsEnum(['male', 'female', 'others'], { message: 'Gender must be one of male, female, or others' })
    gender?: string;
  
    @IsOptional()
    @IsString({ message: 'Location must be a string' })
    @MinLength(1, { message: 'Location must be at least 1 character long' })
    @MaxLength(100, { message: 'Location can be up to 100 characters long' })
    location?: string;
  
    @IsMongoId({ message: 'Admin ID must be a valid MongoId' })
    @IsNotEmpty({ message: 'Admin ID is required' })
    adminId: Types.ObjectId;
  
    // @IsOptional()
    // @IsArray({ message: 'Products must be an array' })
    // @IsMongoId({ each: true, message: 'Each product ID must be a valid MongoId' })
    // products?: string[];
  }