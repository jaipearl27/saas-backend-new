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

  @IsArray()
  @IsOptional()
  assignedEmployees?: Types.ObjectId[];

  @IsOptional()
  @IsMongoId()
  productId?: string;
}

export class UpdateWebinarDto {
  @IsString()
  @IsOptional()
  webinarName?: string;

  @IsString()
  @IsOptional()
  webinarDate?: string;

  @IsArray()
  @IsOptional()
  assignedEmployees?: Types.ObjectId[];

  @IsOptional()
  @IsMongoId()
  productId?: string;
}
