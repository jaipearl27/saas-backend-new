import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { DurationType } from 'src/schemas/BillingHistory.schema';

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

  @IsNumber()
  @IsNotEmpty()
  itemAmount: number;

  @IsNumber()
  @IsNotEmpty()
  taxPercent: number

  @IsNumber()
  @IsNotEmpty()
  taxAmount: number;

  @IsNumber()
  @IsNotEmpty()
  discountAmount: number;

  @IsEnum(DurationType, {
    message: 'Duration type must be one of the allowed values.',
  })
  durationType: DurationType;
}

export class UpdateBillingHistory extends PartialType(BillingHistoryDto){}
