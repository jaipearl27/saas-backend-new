import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubscriptionDto {
  @IsString()
  @IsNotEmpty()
  admin: string;

  @IsString()
  @IsNotEmpty()
  plan: string;

  @IsNumber()
  @IsOptional()
  contactLimit?: number;

  @IsInt({ message: 'Toggle limit must be an integer value.' })
  @Min(0, { message: 'Toggle limit cannot be less than 0.' })
  @IsNotEmpty({ message: 'Toggle limit is required.' })
  toggleLimit: number;

  @IsNumber()
  @IsOptional()
  expiryDate?: number;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  plan?: string;

  @IsOptional()
  @IsNumber()
  contactLimit?: number;

  @IsOptional()
  @IsInt({ message: 'Toggle limit must be an integer value.' })
  @Min(0, { message: 'Toggle limit cannot be less than 0.' })
  @IsNotEmpty({ message: 'Toggle limit is required.' })
  toggleLimit?: number;

  @IsOptional()
  @IsNumber()
  expiryDate?: number; 
}
