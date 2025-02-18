import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateWebinarDto {
  @IsString()
  @IsNotEmpty()
  webinarName: string; // Webinar Name

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  webinarDate?: string; // Webinar Date

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  adminId?: string;


  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignedEmployees?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds?: Types.ObjectId[];
}

export class UpdateWebinarDto {
  @IsString()
  @IsOptional()
  webinarName?: string;

  @IsString()
  @IsOptional()
  webinarDate?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignedEmployees?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds?: Types.ObjectId[];
}
