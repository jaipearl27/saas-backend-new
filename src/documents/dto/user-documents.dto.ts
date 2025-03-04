import { 
  IsMongoId, 
  IsString, 
  IsNumber, 
  IsDateString, 
  IsOptional, 
  IsObject, 
  IsNotEmpty,
  min,
  Min
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateUserDocumentDto {
  @IsMongoId()
  userId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsNumber()
  @Min(0, { message: 'File size must be greater than 0' })
  fileSize: number;

  @IsOptional()
  @IsNumber()
  downloadCount?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

export interface UserDocumentResponse {
  filePath: string;
  fileSize: number;
  success: boolean;
}

