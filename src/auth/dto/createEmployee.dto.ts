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

  @IsEnum(['Sales Employee', 'Reminder Employee'], {
    message: 'Valid role required.',
  })
  role: 'Sales Employee' | 'Reminder Employee';

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
