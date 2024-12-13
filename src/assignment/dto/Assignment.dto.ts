import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignmentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  adminId: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  user: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  webinar: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  attendee: string;

  @IsString()
  @IsNotEmpty()
  recordType: 'preWebinar' | 'postWebinar';
}
