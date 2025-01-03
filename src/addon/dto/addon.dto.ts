import { IsEnum, IsNotEmpty, IsNumber, IsBoolean, IsDate, IsDateString, IsMongoId, Min } from 'class-validator';

export class CreateAddOnDto {
  @IsMongoId()
  @IsNotEmpty()
  admin: string; // Admin user ID

  @IsMongoId()
  @IsNotEmpty()
  subscription: string;

  @IsEnum(['employeeLimit', 'contactLimit'])
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  expiryDate: Date;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  addOnPrice: number;
}

