import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DurationType } from 'src/schemas/BillingHistory.schema';
import { PlanDuration } from 'src/schemas/Plans.schema';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role: string;

  @IsString()
  @IsNotEmpty()
  plan: string;

  @IsNumber()
  @IsOptional()
  currentPlanExpiry?: Number;

  @IsEnum(PlanDuration, {
    message: 'Plan duration must be one of the allowed values.',
  })
  planDuration: PlanDuration;

  @IsNumber()
  @Min(0, { message: 'Billing amount must be a positive number.' })
  itemAmount: number;

  @IsNumber()
  @Min(0, { message: 'Billing amount must be a positive number.' })
  discountAmount: number;

  @IsNumber()
  @Min(0, { message: 'Tax Percent must be a positive number.' })
  taxPercent: number;

  @IsNumber()
  @Min(0, { message: 'Tax Amount must be a positive number.' })
  taxAmount: number;

  @IsNumber()
  @Min(0, { message: 'Amount must be a positive number.' })
  totalAmount: number;

  @IsEnum(DurationType, {
    message: 'Duration type must be one of the allowed values.',
  })
  durationType: DurationType;
}
