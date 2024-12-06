import { IsOptional, IsString, IsBoolean, IsObject, IsNumber } from 'class-validator';

export class RangeStringDto {
    @IsOptional()
    @IsString() // 
    $gte?: string;
  
    @IsOptional()
    @IsString()
    $lte?: string;
  }

  export class RangeNumberDto {
    @IsOptional()
    @IsNumber()  
    $gte?: number;
  
    @IsOptional()
    @IsNumber()
    $lte?: number;
  }

export class GetClientsFilterDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsObject()
  planStartDate?: RangeStringDto;

  @IsOptional()
  @IsObject()
  planExpiry?: RangeStringDto;

  @IsOptional()
  @IsObject()
  contactsLimit?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  totalEmployees?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  employeeSalesCount?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  employeeReminderCount?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  contactsCount?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  toggleLimit?: RangeNumberDto;
}
