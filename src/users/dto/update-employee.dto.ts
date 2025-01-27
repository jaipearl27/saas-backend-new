import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Validate,
  ValidateIf,
} from 'class-validator';
import { EmployeeRole } from 'src/auth/dto/createEmployee.dto';
import { IsEnumOrObjectId } from 'src/utils/custom-validators';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  userName: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @Validate(IsEnumOrObjectId, [EmployeeRole], {
    message: 'Role must be a valid enum value or a MongoDB ObjectId.',
  })
  role: EmployeeRole | string;

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
  @Min(0, { message: 'Daily contact limit must be at least 0.' })
  dailyContactLimit?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1, { message: 'Inactivity time must be at least 1.' })
  inactivityTime?: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ValidateIf((o) => o.isActive !== undefined)
  @IsString()
  @IsNotEmpty({
    message: 'Status change note is required when isActive is provided.',
  })
  statusChangeNote?: string;
}
