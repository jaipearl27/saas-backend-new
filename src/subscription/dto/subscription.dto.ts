import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsNumber()
  @IsOptional()
  expiryDate?: number;
}

export class UpdateSubscriptionDto extends PartialType(SubscriptionDto) {}
