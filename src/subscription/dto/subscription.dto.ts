import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

export class UpdateSubscriptionDto extends PartialType(SubscriptionDto) {}
