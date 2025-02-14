import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  attendee: string;

  @IsString()
  @IsNotEmpty()
  webinar: string;

  @IsString()
  @IsNotEmpty()
  product: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  adminId: string;
}

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  product?: string;
}


export class GetEnrollmentsByProductLevelDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  productLevel: string;
}
