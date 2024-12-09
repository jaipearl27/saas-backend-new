import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export enum EmployeeRole {
  EMPLOYEE_SALES = 'EMPLOYEE_SALES',
  EMPLOYEE_REMINDER = 'EMPLOYEE_REMINDER',
}

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(EmployeeRole, { message: 'Valid role required.' })
  role: EmployeeRole;

  @IsOptional()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 numeric digits.',
  })
  phone?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0, { message: 'Valid call time must be at least 0 hours.' })
  validCallTime?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1, { message: 'Daily contact limit must be at least 1.' })
  dailyContactLimit?: number;
}
