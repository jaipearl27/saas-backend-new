import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  previousName?: string;

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  isVerified: boolean;

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  isAdminVerified: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  employee?: string;

  @ValidateIf((o) => o.employee)
  @IsString()
  @IsNotEmpty()
  admin?: string;

  @IsOptional()
  color?: any;
}

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  isAdminVerified?: boolean;
}

export class AdminVerificationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  previousName?: string;

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  isAdminVerified?: boolean;
}
