import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PlanType } from 'src/schemas/Plans.schema';

export class CreatePlansDto {
  @IsString()
  @IsNotEmpty()
  name: string;
    
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  employeeCount: number;

  @IsNumber()
  @IsNotEmpty()
  contactLimit: number;

  @IsObject()
  @IsNotEmpty()
  attendeeTableConfig: Map<string, any>;

  @IsNumber()
  @Min(0, { message: 'Minimum value is 0' })
  toggleLimit: number;

  @IsEnum(PlanType)
  planType: PlanType;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignedUsers: string[];
}