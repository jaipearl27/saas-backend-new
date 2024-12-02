import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWebinarDto {
  @IsString()
  @IsNotEmpty()
  webinarName: string; // Webinar Name

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  webinarDate?: string; // Webinar Date

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  adminId?: string;
}

export class UpdateWebinarDto {
  @IsString()
  @IsOptional()
  webinarName?: string;

  @IsString()
  @IsOptional()
  webinarDate?: string;
}
