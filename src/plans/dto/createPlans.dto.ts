import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';
import { PlanType } from 'src/schemas/Plans.schema';

export class CreatePlansDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  internalName: string;

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

  @IsOptional()
  @IsBoolean()
  whatsappNotificationOnAlarms: boolean;

  @IsOptional()
  @IsBoolean()
  employeeInactivity: boolean;

  @IsOptional()
  @IsBoolean()
  employeeRealTimeStatusUpdate: boolean;

  @IsOptional()
  @IsBoolean()
  calendarFeatures: boolean;

  @IsOptional()
  @IsBoolean()
  productRevenueMetrics: boolean;

  @IsOptional()
  @IsBoolean()
  setAlarm: boolean;
  
  @IsOptional()
  @IsBoolean()
  renewalNotAllowed: boolean;

  @IsOptional()
  @IsString()
  customRibbon: string;

  @IsOptional()
  @IsString()
  customRibbonColor: string;
}

class PlanDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0, { message: 'Minimum value is 0' })
  sortOrder: number;

  @IsMongoId()
  id: string;
}

export class PlanOrderDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanDTO)
  plans: PlanDTO[];
}

export class IdParamsDTO {
  @IsMongoId()
  id: string;
}
