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

  @IsEnum(DurationType, {
    message: 'Duration type must be one of the allowed values.',
  })
  durationType: DurationType;
}
