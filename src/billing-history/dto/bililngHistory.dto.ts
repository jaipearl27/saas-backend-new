import { PartialType } from '@nestjs/mapped-types';
import { IsMongoId, IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class BillingHistoryDto {
  @IsObject()
  @IsNotEmpty()
  admin: string;

  @IsString()
  @IsNotEmpty()
  plan: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class UpdateBillingHistory extends PartialType(BillingHistoryDto){}
