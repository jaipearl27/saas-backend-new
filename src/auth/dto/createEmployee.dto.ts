import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  email: string;

  @IsEnum(['EMPLOYEE_SALES', 'EMPLOYEE_REMINDER'], {
    message: 'Valid role required.',
  })
  role: 'EMPLOYEE_SALES' | 'EMPLOYEE_REMINDER';

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Valid call time must be at least 0 hours.' })
  validCallTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Daily contact limit must be at least 0.' })
  dailyContactLimit?: number;
}
