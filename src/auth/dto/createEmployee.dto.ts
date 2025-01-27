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
  @Matches(/^\+\d{1,3}\d{9}$/, {
    message:
      '10 Digit Phone number with Country Code is required, eg: +911234567890',
  })
  phone?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0, { message: 'Valid call time must be at least 0 hours.' })
  validCallTime?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1, { message: 'Daily contact limit must be at least 1.' })
  contactLimit?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1, { message: 'Inactivity Time must be at least 1.' })
  inactivityTime?: number;
}
